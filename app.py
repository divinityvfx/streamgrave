import os
import logging
import tempfile
import subprocess
import re
import uuid
import shutil
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs
from flask import Flask, render_template, request, send_file, jsonify, flash, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import yt_dlp
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
import threading
import time



# Get cookies.txt content from the secret
cookies_content = os.environ.get("YTDL_COOKIES")

# Save it as an actual file yt-dlp can use
if cookies_content:
    with open("cookies.txt", "w", newline="\n") as f:
        f.write(cookies_content)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "spooky_halloween_secret_2025")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the database
database_url = os.environ.get("DATABASE_URL")
if database_url:
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    # Initialize the app with the extension
    db.init_app(app)
else:
    # Fallback to in-memory tracking if no database
    db = None

# Online users tracking
online_users = set()

# Global dictionary to store download progress
download_progress = {}

# User session model for tracking online users (only if database is available)
UserSession = None
if database_url and db:
    class UserSession(db.Model):
        __tablename__ = 'user_sessions'
        id = db.Column(db.String, primary_key=True)
        ip_address = db.Column(db.String, nullable=False)
        user_agent = db.Column(db.String, nullable=False)
        last_seen = db.Column(db.DateTime, default=datetime.utcnow)
        created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Create tables
    with app.app_context():
        db.create_all()

def get_client_info():
    """Get secure client information for user tracking"""
    ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
    if ',' in ip:
        ip = ip.split(',')[0].strip()
    user_agent = request.headers.get('User-Agent', 'unknown')[:200]  # Limit length
    return ip, user_agent

def track_user_session():
    """Track user sessions securely"""
    if 'user_session_id' not in session:
        session['user_session_id'] = str(uuid.uuid4())
        session.permanent = True
    
    session_id = session['user_session_id']
    ip, user_agent = get_client_info()
    
    # Add to in-memory set for quick counts
    online_users.add(session_id)
    
    # Store in database if available
    if db and UserSession:
        try:
            with app.app_context():
                user_session = UserSession.query.filter_by(id=session_id).first()
                if user_session:
                    user_session.last_seen = datetime.utcnow()
                    user_session.ip_address = ip
                    user_session.user_agent = user_agent
                else:
                    user_session = UserSession(
                        id=session_id,
                        ip_address=ip,
                        user_agent=user_agent
                    )
                    db.session.add(user_session)
                db.session.commit()
        except Exception as e:
            logging.error(f"Error tracking user session: {e}")

def cleanup_old_sessions():
    """Clean up old user sessions"""
    try:
        if db and UserSession:
            with app.app_context():
                cutoff_time = datetime.utcnow() - timedelta(minutes=5)
                old_sessions = UserSession.query.filter(UserSession.last_seen < cutoff_time).all()
                for session_obj in old_sessions:
                    online_users.discard(session_obj.id)
                    db.session.delete(session_obj)
                db.session.commit()
    except Exception as e:
        logging.error(f"Error cleaning up sessions: {e}")

def get_online_count():
    """Get current online user count"""
    cleanup_old_sessions()
    return len(online_users)

@app.before_request
def before_request():
    """Handle user tracking before each request"""
    if request.endpoint not in ['static']:
        track_user_session()

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def is_valid_youtube_url(url):
    """Validate if the URL is a valid YouTube URL"""
    return extract_video_id(url) is not None

def get_video_info(url):
    """Get video information using yt-dlp"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            '--cookies', 'cookies.txt',
            '--no-check-certificate',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if info:
                return {
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', 'Unknown'),
                    '--cookies', 'cookies.txt',
                    '--no-check-certificate',
                }
            else:
                return None
    except Exception as e:
        logging.error(f"Error getting video info: {str(e)}")
        return None

def progress_hook(d):
    """Progress hook for yt-dlp"""
    if d['status'] == 'downloading':
        info_dict = d.get('info_dict', {})
        if info_dict:
            video_id = info_dict.get('id', 'unknown')
        else:
            video_id = 'unknown'
            
        if 'downloaded_bytes' in d and 'total_bytes' in d:
            progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
            download_progress[video_id] = {
                'status': 'downloading',
                'progress': progress,
                'stage': 'Downloading audio...'
            }
        elif 'downloaded_bytes' in d and 'total_bytes_estimate' in d:
            progress = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
            download_progress[video_id] = {
                'status': 'downloading',
                'progress': progress,
                'stage': 'Downloading audio...'
            }

def download_and_convert(url, quality, video_id, format_type='wav'):
    """Download YouTube video and convert to WAV or MP4 with enhanced quality"""
    try:
        # Update progress
        download_progress[video_id] = {
            'status': 'starting',
            'progress': 0,
            'stage': f'Preparing {format_type.upper()} download...'
        }
        
        # Create temporary directory
        temp_dir = tempfile.mkdtemp()
        
        # Configure format options based on type
        if format_type == 'mp4':
            # MP4 video download options
            if quality == 'best':
                format_selector = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
            elif quality == '1080p':
                format_selector = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]'
            elif quality == '720p':
                format_selector = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]'
            elif quality == '480p':
                format_selector = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]'
            else:  # 360p
                format_selector = 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]'
        else:
            # Audio-only download options for WAV conversion
            if quality == 'best':
                format_selector = 'bestaudio[acodec=opus]/bestaudio[acodec=aac]/bestaudio/best'
                audio_quality = '0'  # Lossless conversion
            elif quality == '320':
                format_selector = 'bestaudio[acodec=opus]/bestaudio[acodec=aac]/bestaudio/best'
                audio_quality = '320'
            elif quality == '192':
                format_selector = 'bestaudio[acodec=opus]/bestaudio[acodec=aac]/bestaudio/best'
                audio_quality = '192'
            else:  # 128
                format_selector = 'bestaudio[acodec=opus]/bestaudio[acodec=aac]/bestaudio/best'
                audio_quality = '128'
        
        # Configure yt-dlp options based on format
        if format_type == 'mp4':
            ydl_opts = {
                'format': format_selector,
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'progress_hooks': [progress_hook],
                'merge_output_format': 'mp4',
                '--cookies', 'cookies.txt',
                '--no-check-certificate',
                
                
            }
        else:
            # WAV audio extraction
            ydl_opts = {
                'format': format_selector,
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'wav',
                    'preferredquality': audio_quality if quality != 'best' else '0',
                }],
                'postprocessor_args': [
                    '-ar', '44100',  # Sample rate
                    '-ac', '2',      # Stereo
                ] if quality == 'best' else [],
                'progress_hooks': [progress_hook],
                '--cookies', 'cookies.txt',
                '--no-check-certificate',
                
            }
        
        # Download and extract/convert
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'video')
            
        # Update progress
        download_progress[video_id] = {
            'status': 'converting',
            'progress': 80,
            'stage': f'Converting to {format_type.upper()}...'
        }
        
        # Find the converted file
        if format_type == 'mp4':
            target_files = [f for f in os.listdir(temp_dir) if f.endswith('.mp4')]
            file_extension = 'mp4'
        else:
            target_files = [f for f in os.listdir(temp_dir) if f.endswith('.wav')]
            file_extension = 'wav'
            
        if not target_files:
            raise Exception(f"{format_type.upper()} conversion failed")
        
        target_file = target_files[0]
        target_path = os.path.join(temp_dir, target_file)
        
        # Create downloads directory if it doesn't exist
        downloads_dir = os.path.join(app.root_path, 'downloads')
        os.makedirs(downloads_dir, exist_ok=True)
        
        # Generate safe filename
        safe_title = secure_filename(title)
        final_filename = f"{safe_title}_{quality}.{file_extension}"
        final_path = os.path.join(downloads_dir, final_filename)
        
        # Copy file to downloads directory (handles cross-device links)
        shutil.copy2(target_path, final_path)
        
        # Clean up temp directory
        shutil.rmtree(temp_dir)
        
        # Update progress
        download_progress[video_id] = {
            'status': 'completed',
            'progress': 100,
            'stage': 'Download ready!',
            'filename': final_filename,
            'filepath': final_path
        }
        
        return final_path, final_filename
        
    except Exception as e:
        logging.error(f"Download error: {str(e)}")
        download_progress[video_id] = {
            'status': 'error',
            'progress': 0,
            'stage': f'Error: {str(e)}'
        }
        return None, None

@app.route('/')
def index():
    return render_template('index.html', online_count=get_online_count())

@app.route('/api/online-count')
def online_count_api():
    """API endpoint for getting online user count"""
    try:
        count = get_online_count()
        return jsonify({'count': count})
    except Exception as e:
        logging.error(f"Error getting online count: {e}")
        return jsonify({'count': 0}), 500

@app.route('/api/ad-config')
def ad_config_api():
    """API endpoint for ad configuration"""
    return jsonify({
        'enabled': True,
        'showAfterDownload': True,
        'showOnVisit': False,  # Don't show immediately on page load
        'frequency': 300000,  # Show every 5 minutes max
        'delay': 3000,  # 3 second delay after download completion
        'adNetworks': {
            'google': True,
            'custom': True
        }
    })

@app.route('/api/ad-impression', methods=['POST'])
def track_ad_impression():
    """Track ad impressions for revenue analytics"""
    try:
        data = request.get_json()
        # Log impression for analytics (you can store in database or send to analytics service)
        logging.info(f"Ad impression: {data.get('type')} at {data.get('timestamp')}")
        return jsonify({'status': 'tracked'})
    except Exception as e:
        logging.error(f"Error tracking ad impression: {e}")
        return jsonify({'status': 'error'}), 500

@app.route('/api/ad-click', methods=['POST'])
def track_ad_click():
    """Track ad clicks for revenue analytics"""
    try:
        data = request.get_json()
        # Log click for analytics (higher value than impressions)
        logging.info(f"Ad click: {data.get('type')} to {data.get('destination')} at {data.get('timestamp')}")
        return jsonify({'status': 'tracked'})
    except Exception as e:
        logging.error(f"Error tracking ad click: {e}")
        return jsonify({'status': 'error'}), 500

@app.route('/download', methods=['POST'])
def download():
    url = request.form.get('url', '').strip()
    format_type = request.form.get('format', 'wav')  # wav or mp4
    quality = request.form.get('quality', '192')
    
    if not url:
        flash('Please enter a YouTube URL', 'error')
        return redirect(url_for('index'))
    
    if not is_valid_youtube_url(url):
        flash('Please enter a valid YouTube URL', 'error')
        return redirect(url_for('index'))
    
    # Get video info
    video_info = get_video_info(url)
    if not video_info:
        flash('Unable to process this video. Please check the URL and try again.', 'error')
        return redirect(url_for('index'))
    
    video_id = extract_video_id(url)
    
    # Start download in background thread
    def download_thread():
        download_and_convert(url, quality, video_id, format_type)
    
    thread = threading.Thread(target=download_thread)
    thread.daemon = True
    thread.start()
    
    return render_template('download.html', 
                         video_info=video_info, 
                         video_id=video_id,
                         quality=quality,
                         format=format_type)

@app.route('/progress/<video_id>')
def get_progress(video_id):
    """Get download progress for a video"""
    progress = download_progress.get(video_id, {
        'status': 'not_found',
        'progress': 0,
        'stage': 'Video not found'
    })
    return jsonify(progress)

@app.route('/download_file/<filename>')
def download_file(filename):
    """Serve the downloaded WAV file"""
    try:
        downloads_dir = os.path.join(app.root_path, 'downloads')
        file_path = os.path.join(downloads_dir, filename)
        
        if not os.path.exists(file_path):
            flash('File not found', 'error')
            return redirect(url_for('index'))
        
        def cleanup_file():
            """Clean up the file after a delay"""
            time.sleep(300)  # Wait 5 minutes
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logging.info(f"Cleaned up file: {filename}")
            except Exception as e:
                logging.error(f"Error cleaning up file {filename}: {str(e)}")
        
        # Start cleanup thread
        cleanup_thread = threading.Thread(target=cleanup_file)
        cleanup_thread.daemon = True
        cleanup_thread.start()
        
        return send_file(file_path, as_attachment=True, download_name=filename)
        
    except Exception as e:
        logging.error(f"Error serving file: {str(e)}")
        flash('Error downloading file', 'error')
        return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
