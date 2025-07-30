/**
 * SpookyTube Ad Management System
 * Non-intrusive advertising that respects user experience
 */

class SpookyAds {
    constructor() {
        this.config = {
            enabled: true,
            lastAdShown: 0,
            frequency: 300000, // 5 minutes
            delay: 3000, // 3 seconds after download
            maxAdsPerSession: 3,
            adsShownThisSession: 0
        };
        this.init();
    }

    async init() {
        try {
            const response = await fetch('/api/ad-config');
            const serverConfig = await response.json();
            this.config = { ...this.config, ...serverConfig };
        } catch (error) {
            console.log('Using default ad configuration');
        }
        
        this.setupAdContainers();
        this.loadAdNetworks();
    }

    setupAdContainers() {
        // Create ad overlay container
        const adOverlay = document.createElement('div');
        adOverlay.id = 'spooky-ad-overlay';
        adOverlay.className = 'spooky-ad-overlay';
        adOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.5s ease-in-out;
        `;
        
        const adContainer = document.createElement('div');
        adContainer.className = 'spooky-ad-container';
        adContainer.style.cssText = `
            background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
            border: 2px solid #ff6b35;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 400px;
            position: relative;
            box-shadow: 0 20px 40px rgba(255, 107, 53, 0.4);
            text-align: center;
            color: white;
        `;

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.className = 'spooky-ad-close';
        closeButton.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: 2px solid #ff6b35;
            color: #ff6b35;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
            z-index: 10001;
        `;
        
        closeButton.onmouseover = () => {
            closeButton.style.background = '#ff6b35';
            closeButton.style.color = 'white';
        };
        
        closeButton.onmouseout = () => {
            closeButton.style.background = 'none';
            closeButton.style.color = '#ff6b35';
        };

        closeButton.onclick = () => this.closeAd();

        const adContent = document.createElement('div');
        adContent.id = 'spooky-ad-content';
        adContent.style.cssText = `
            margin-top: 20px;
            min-height: 250px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;

        adContainer.appendChild(closeButton);
        adContainer.appendChild(adContent);
        adOverlay.appendChild(adContainer);
        document.body.appendChild(adOverlay);

        // Create banner ad container
        const bannerContainer = document.createElement('div');
        bannerContainer.id = 'spooky-banner-ad';
        bannerContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            height: 100px;
            background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
            border: 2px solid #ff6b35;
            border-radius: 10px;
            display: none;
            z-index: 9999;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
        `;
        
        document.body.appendChild(bannerContainer);
    }

    loadAdNetworks() {
        // Google AdSense integration
        if (this.config.adNetworks?.google) {
            this.loadGoogleAds();
        }
        
        // Custom ad network
        if (this.config.adNetworks?.custom) {
            this.setupCustomAds();
        }
    }

    loadGoogleAds() {
        // Load Google AdSense script
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.setAttribute('data-ad-client', 'ca-pub-8983597889273389'); // Replace with your AdSense ID
        document.head.appendChild(script);
    }

    setupCustomAds() {
        // Custom ad content for fallback or direct partnerships
        this.customAds = [
            {
                title: '💖 Support StreamGrave',
                content: 'Help keep this service free by making a small donation. Every contribution helps cover server costs!',
                cta: 'Donate Now',
                action: () => window.open('https://paypal.me/streamgrave', '_blank')
            },
            {
                title: '🎵 More Audio Tools',
                content: 'Discover more audio conversion tools and music utilities for your creative projects.',
                cta: 'Explore Tools',
                action: () => window.open('https://streamgrave.xyz/tools', '_blank')
            },
            {
                title: '🚀 Share StreamGrave',
                content: 'Love this tool? Share it with friends and help us grow our community!',
                cta: 'Share Now',
                action: () => this.shareStreamGrave()
            }
        ];
    }

    canShowAd() {
        const now = Date.now();
        const timeSinceLastAd = now - this.config.lastAdShown;
        
        return (
            this.config.enabled &&
            this.config.adsShownThisSession < this.config.maxAdsPerSession &&
            timeSinceLastAd >= this.config.frequency
        );
    }

    showAdAfterDownload() {
        if (!this.canShowAd()) return;
        
        setTimeout(() => {
            this.showPopupAd();
        }, this.config.delay);
    }

    showPopupAd() {
        if (!this.canShowAd()) return;

        const overlay = document.getElementById('spooky-ad-overlay');
        const content = document.getElementById('spooky-ad-content');
        
        // Try Google AdSense first
        if (window.adsbygoogle && this.config.adNetworks?.google) {
            content.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #ff6b35; margin-bottom: 15px;">
                        <i class="fas fa-magic"></i> Keep SpookyTube Running
                    </h4>
                    <p style="color: #ccc; margin-bottom: 20px;">
                        This free service is supported by ads. Thank you for your patience!
                    </p>
                </div>
                <ins class="adsbygoogle"
                     style="display:block; width:300px; height:250px;"
                     data-ad-client="ca-pub-8983597889273389"
                     data-ad-slot="YOUR_AD_SLOT_ID">
                </ins>
            `;
            
            try {
                (adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                this.showCustomAd(content);
            }
        } else {
            this.showCustomAd(content);
        }

        overlay.style.display = 'flex';
        this.config.lastAdShown = Date.now();
        this.config.adsShownThisSession++;
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (overlay.style.display === 'flex') {
                this.closeAd();
            }
        }, 10000);
    }

    showCustomAd(content) {
        const ad = this.customAds[Math.floor(Math.random() * this.customAds.length)];
        
        content.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #ff6b35; margin-bottom: 20px; font-size: 1.5rem;">
                    ${ad.title}
                </h3>
                <p style="color: #ccc; margin-bottom: 25px; line-height: 1.6;">
                    ${ad.content}
                </p>
                <button id="ad-cta-button" style="
                    background: linear-gradient(45deg, #ff6b35, #ff8c5a);
                    border: none;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 16px;
                ">
                    ${ad.cta}
                </button>
            </div>
        `;
        
        const ctaButton = content.querySelector('#ad-cta-button');
        ctaButton.onmouseover = () => {
            ctaButton.style.transform = 'translateY(-2px)';
            ctaButton.style.boxShadow = '0 5px 15px rgba(255, 107, 53, 0.4)';
        };
        
        ctaButton.onmouseout = () => {
            ctaButton.style.transform = 'translateY(0)';
            ctaButton.style.boxShadow = 'none';
        };
        
        ctaButton.onclick = () => {
            ad.action();
            this.closeAd();
        };
    }

    showBannerAd() {
        if (!this.canShowAd()) return;
        
        const banner = document.getElementById('spooky-banner-ad');
        banner.innerHTML = `
            <div style="padding: 15px; height: 100%; display: flex; align-items: center; justify-content: space-between;">
                <div style="flex-grow: 1;">
                    <small style="color: var(--color-primary, #3b82f6); font-weight: bold;">Support StreamGrave</small>
                    <div style="color: #ccc; font-size: 12px; margin-top: 5px;">
                        Help keep this service free!
                    </div>
                </div>
                <button onclick="window.open('https://paypal.me/streamgrave', '_blank')" style="
                    background: var(--color-primary, #3b82f6);
                    border: none;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">
                    Donate
                </button>
                <button onclick="spookyAds.closeBanner()" style="
                    background: none;
                    border: none;
                    color: var(--color-primary, #3b82f6);
                    margin-left: 10px;
                    cursor: pointer;
                ">
                    ×
                </button>
            </div>
        `;
        
        banner.style.display = 'block';
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
            this.closeBanner();
        }, 15000);
    }

    closeAd() {
        const overlay = document.getElementById('spooky-ad-overlay');
        overlay.style.display = 'none';
    }

    closeBanner() {
        const banner = document.getElementById('spooky-banner-ad');
        banner.style.display = 'none';
    }

    shareStreamGrave() {
        if (navigator.share) {
            navigator.share({
                title: 'StreamGrave - YouTube Downloader',
                text: 'Convert YouTube videos to high-quality WAV and MP4 files with this fast, free tool!',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link copied to clipboard!');
            });
        }
        this.closeAd();
    }

    // Revenue tracking methods
    trackAdImpression(adType) {
        // Send impression data to your analytics
        fetch('/api/ad-impression', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: adType,
                timestamp: Date.now(),
                session: sessionStorage.getItem('session_id') || 'anonymous'
            })
        }).catch(() => {}); // Silent fail
    }

    trackAdClick(adType, destination) {
        // Send click data to your analytics
        fetch('/api/ad-click', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: adType,
                destination: destination,
                timestamp: Date.now(),
                session: sessionStorage.getItem('session_id') || 'anonymous'
            })
        }).catch(() => {}); // Silent fail
    }
}

// CSS animations
if (!document.querySelector('#spooky-ad-styles')) {
    const style = document.createElement('style');
    style.id = 'spooky-ad-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideInFromBottom {
            from { 
                transform: translateY(100%);
                opacity: 0;
            }
            to { 
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .spooky-ad-overlay {
            animation: fadeIn 0.5s ease-in-out;
        }
        
        #spooky-banner-ad {
            animation: slideInFromBottom 0.5s ease-out;
        }
        
        @media (max-width: 768px) {
            #spooky-banner-ad {
                width: calc(100% - 40px);
                left: 20px;
                right: 20px;
                bottom: 20px;
            }
            
            .spooky-ad-container {
                margin: 20px;
                max-width: calc(100% - 40px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize ads system
const spookyAds = new SpookyAds();

// Export for global access
window.spookyAds = spookyAds;
