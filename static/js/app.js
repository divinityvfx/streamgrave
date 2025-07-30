/**
 * SpookyTube - Halloween YouTube to WAV Converter
 * Client-side JavaScript functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    setupFormValidation();
    setupUIInteractions();
    setupHalloweenEffects();
}

/**
 * Setup form validation for the YouTube URL input
 */
function setupFormValidation() {
    const form = document.querySelector('.spooky-form');
    const urlInput = document.getElementById('url');
    const bitrateSelect = document.getElementById('bitrate');

    if (!form || !urlInput) return;

    // Real-time URL validation
    urlInput.addEventListener('input', function() {
        validateYouTubeURL(this.value.trim());
    });

    // Form submission validation
    form.addEventListener('submit', function(e) {
        const url = urlInput.value.trim();
        
        if (!url) {
            e.preventDefault();
            showValidationError(urlInput, 'Please enter a YouTube URL');
            return;
        }

        if (!isValidYouTubeURL(url)) {
            e.preventDefault();
            showValidationError(urlInput, 'Please enter a valid YouTube URL');
            return;
        }

        // Show loading state
        showLoadingState(this);
    });

    // Clear validation on focus
    urlInput.addEventListener('focus', function() {
        clearValidationError(this);
    });
}

/**
 * Validate YouTube URL format
 */
function isValidYouTubeURL(url) {
    const patterns = [
        /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=[\w-]+/
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Real-time URL validation with visual feedback
 */
function validateYouTubeURL(url) {
    const urlInput = document.getElementById('url');
    if (!urlInput) return;

    if (url.length === 0) {
        clearValidationError(urlInput);
        return;
    }

    if (isValidYouTubeURL(url)) {
        showValidationSuccess(urlInput);
    } else if (url.length > 10) {
        showValidationError(urlInput, 'Invalid YouTube URL format');
    }
}

/**
 * Show validation error
 */
function showValidationError(input, message) {
    clearValidationError(input);
    
    input.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    input.parentNode.appendChild(errorDiv);
}

/**
 * Show validation success
 */
function showValidationSuccess(input) {
    clearValidationError(input);
    input.classList.add('is-valid');
}

/**
 * Clear validation state
 */
function clearValidationError(input) {
    input.classList.remove('is-invalid', 'is-valid');
    
    const existingFeedback = input.parentNode.querySelector('.invalid-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
}

/**
 * Show loading state during form submission
 */
function showLoadingState(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
    submitBtn.disabled = true;

    // Store original text for potential restoration
    submitBtn.dataset.originalText = originalText;
}

/**
 * Setup UI interactions and enhancements
 */
function setupUIInteractions() {
    // Auto-focus URL input on page load
    const urlInput = document.getElementById('url');
    if (urlInput && !urlInput.value) {
        setTimeout(() => urlInput.focus(), 500);
    }

    // Bitrate selection info
    const bitrateSelect = document.getElementById('bitrate');
    if (bitrateSelect) {
        bitrateSelect.addEventListener('change', function() {
            showBitrateInfo(this.value);
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.querySelector('.spooky-form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    });

    // Paste handling for URL input
    if (urlInput) {
        urlInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                const pastedText = this.value.trim();
                if (pastedText) {
                    validateYouTubeURL(pastedText);
                }
            }, 10);
        });
    }
}

/**
 * Show bitrate selection information
 */
function showBitrateInfo(bitrate) {
    const infoMessages = {
        'highest': 'Best available quality from the source video',
        '320': 'High quality audio, suitable for music production',
        '192': 'Standard quality, good balance of size and quality',
        '128': 'Good quality, smaller file size'
    };

    const message = infoMessages[bitrate] || 'Audio quality information';
    
    // Create or update info tooltip
    let tooltip = document.querySelector('.bitrate-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'bitrate-tooltip alert alert-info mt-2';
        tooltip.style.fontSize = '0.85rem';
        document.getElementById('bitrate').parentNode.appendChild(tooltip);
    }

    tooltip.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    
    // Auto-hide after 3 seconds
    clearTimeout(tooltip.hideTimeout);
    tooltip.hideTimeout = setTimeout(() => {
        tooltip.style.opacity = '0.7';
    }, 3000);
}

/**
 * Setup Halloween-themed visual effects
 */
function setupHalloweenEffects() {
    // Floating particles effect
    createFloatingParticles();
    
    // Spooky hover effects
    setupSpookyHoverEffects();
    
    // Random spooky sounds (optional, commented out for now)
    // setupSpookySounds();
}

/**
 * Create floating Halloween particles
 */
function createFloatingParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'halloween-particles';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
    `;
    
    document.body.appendChild(particleContainer);

    const particles = ['🎃', '👻', '🦇', '🕷️', '🕸️'];
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 10}px;
            opacity: ${Math.random() * 0.3 + 0.1};
            left: ${Math.random() * 100}%;
            top: -50px;
            animation: float-down ${Math.random() * 10 + 10}s linear infinite;
            pointer-events: none;
        `;
        
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particleContainer.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 20000);
    }

    // Create particles periodically
    setInterval(createParticle, 3000);
    
    // Add CSS animation
    if (!document.querySelector('#particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes float-down {
                to {
                    transform: translateY(calc(100vh + 50px)) rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Setup spooky hover effects
 */
function setupSpookyHoverEffects() {
    // Spooky button hover sounds (visual feedback only)
    const buttons = document.querySelectorAll('.spooky-btn-primary, .spooky-btn-secondary');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-1px) scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
    });

    // Spooky card tilt effect
    const cards = document.querySelectorAll('.spooky-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

/**
 * Utility function to show toast notifications
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    toast.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
    
    // Click to dismiss
    toast.addEventListener('click', function() {
        this.style.opacity = '0';
        this.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        }, 300);
    });
}

/**
 * Handle clipboard functionality for sharing
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        showToast('Could not copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Initialize service worker for offline functionality (if needed in the future)
 */
function initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/static/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

// Export functions for potential use in other scripts
window.SpookyTube = {
    showToast,
    copyToClipboard,
    isValidYouTubeURL,
    validateYouTubeURL
};
      
