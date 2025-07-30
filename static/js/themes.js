/**
 * StreamGrave Holiday Theme System
 * Automatically changes themes based on major holidays
 */

class HolidayThemes {
    constructor() {
        this.themes = {
            halloween: {
                name: "Halloween",
                dates: [
                    { start: "10-01", end: "11-01" } // October 1 - November 1
                ],
                colors: {
                    primary: "#ff6b35",
                    secondary: "#ff8c5a", 
                    background: "#1a1a1a",
                    surface: "#2d2d2d",
                    text: "#ffffff",
                    accent: "#8b5cf6"
                },
                icon: "🎃",
                animations: "floating-ghosts"
            },
            christmas: {
                name: "Christmas",
                dates: [
                    { start: "12-01", end: "12-26" } // December 1 - 26
                ],
                colors: {
                    primary: "#dc2626",
                    secondary: "#16a34a",
                    background: "#0f1419",
                    surface: "#1e293b", 
                    text: "#ffffff",
                    accent: "#fbbf24"
                },
                icon: "🎄",
                animations: "snow-effect"
            },
            valentines: {
                name: "Valentine's Day",
                dates: [
                    { start: "02-10", end: "02-15" } // February 10 - 15
                ],
                colors: {
                    primary: "#ec4899",
                    secondary: "#f97316",
                    background: "#18181b",
                    surface: "#27272a",
                    text: "#ffffff", 
                    accent: "#a855f7"
                },
                icon: "💝",
                animations: "heart-float"
            },
            newyear: {
                name: "New Year",
                dates: [
                    { start: "12-31", end: "01-02" } // Dec 31 - Jan 2
                ],
                colors: {
                    primary: "#fbbf24",
                    secondary: "#a855f7",
                    background: "#111827",
                    surface: "#1f2937",
                    text: "#ffffff",
                    accent: "#06b6d4"
                },
                icon: "🎊",
                animations: "confetti-burst"
            },
            independence: {
                name: "Independence Day",
                dates: [
                    { start: "07-01", end: "07-05" } // July 1 - 5
                ],
                colors: {
                    primary: "#dc2626",
                    secondary: "#1e40af", 
                    background: "#111827",
                    surface: "#1f2937",
                    text: "#ffffff",
                    accent: "#ffffff"
                },
                icon: "🇺🇸",
                animations: "fireworks"
            },
            default: {
                name: "StreamGrave",
                colors: {
                    primary: "#3b82f6",
                    secondary: "#8b5cf6",
                    background: "#111827",
                    surface: "#1f2937", 
                    text: "#ffffff",
                    accent: "#06b6d4"
                },
                icon: "🎵",
                animations: "subtle-glow"
            }
        };
        
        this.currentTheme = this.getCurrentTheme();
        this.applyTheme();
        this.initAnimations();
    }

    getCurrentTheme() {
        const now = new Date();
        const currentDate = this.formatDate(now);
        
        // Check each holiday theme
        for (const [key, theme] of Object.entries(this.themes)) {
            if (theme.dates) {
                for (const dateRange of theme.dates) {
                    if (this.isDateInRange(currentDate, dateRange.start, dateRange.end)) {
                        return { key, ...theme };
                    }
                }
            }
        }
        
        return { key: 'default', ...this.themes.default };
    }

    formatDate(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}-${day}`;
    }

    isDateInRange(current, start, end) {
        // Handle year-end rollover (Dec 31 - Jan 2)
        if (start > end) {
            return current >= start || current <= end;
        }
        return current >= start && current <= end;
    }

    applyTheme() {
        const theme = this.currentTheme;
        const root = document.documentElement;
        
        // Apply CSS custom properties
        root.style.setProperty('--color-primary', theme.colors.primary);
        root.style.setProperty('--color-secondary', theme.colors.secondary);
        root.style.setProperty('--color-background', theme.colors.background);
        root.style.setProperty('--color-surface', theme.colors.surface);
        root.style.setProperty('--color-text', theme.colors.text);
        root.style.setProperty('--color-accent', theme.colors.accent);
        
        // Update page title and favicon
        document.title = `StreamGrave ${theme.icon} - YouTube Downloader`;
        
        // Apply theme class to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme.key}`);
        
        // Update branding text
        this.updateBrandingText();
        
        console.log(`🎨 Applied ${theme.name} theme`);
    }

    updateBrandingText() {
        const theme = this.currentTheme;
        
        // Update main logo/title
        const logoElements = document.querySelectorAll('.logo, .brand-title, h1');
        logoElements.forEach(el => {
            if (el.textContent.includes('SpookyTube') || el.textContent.includes('StreamGrave')) {
                el.textContent = `StreamGrave ${theme.icon}`;
            }
        });
        
        // Update taglines based on theme
        const taglines = document.querySelectorAll('.tagline, .subtitle');
        taglines.forEach(el => {
            switch(theme.key) {
                case 'halloween':
                    el.textContent = '🎃 Spookily fast YouTube to audio/video downloads';
                    break;
                case 'christmas':
                    el.textContent = '🎄 Your holiday gift for YouTube downloads';
                    break;
                case 'valentines':
                    el.textContent = '💝 Fall in love with fast downloads';
                    break;
                case 'newyear':
                    el.textContent = '🎊 Start the year with better downloads';
                    break;
                case 'independence':
                    el.textContent = '🇺🇸 Freedom to download your favorite content';
                    break;
                default:
                    el.textContent = '🎵 Fast YouTube to audio/video downloads';
            }
        });
    }

    initAnimations() {
        // Remove existing animation styles
        const existingStyles = document.querySelector('#holiday-animations');
        if (existingStyles) existingStyles.remove();
        
        const style = document.createElement('style');
        style.id = 'holiday-animations';
        
        switch(this.currentTheme.animations) {
            case 'floating-ghosts':
                style.textContent = this.getHalloweenAnimations();
                break;
            case 'snow-effect':
                style.textContent = this.getChristmasAnimations();
                break;
            case 'heart-float':
                style.textContent = this.getValentinesAnimations();
                break;
            case 'confetti-burst':
                style.textContent = this.getNewYearAnimations();
                break;
            case 'fireworks':
                style.textContent = this.getIndependenceAnimations();
                break;
            default:
                style.textContent = this.getDefaultAnimations();
        }
        
        document.head.appendChild(style);
    }

    getHalloweenAnimations() {
        return `
            @keyframes float-ghost {
                0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
                50% { transform: translateY(-20px) rotate(5deg); opacity: 1; }
            }
            
            .floating-ghost {
                position: fixed;
                font-size: 2rem;
                animation: float-ghost 4s ease-in-out infinite;
                pointer-events: none;
                z-index: 1;
            }
            
            body::before {
                content: '👻';
                position: fixed;
                top: 20%;
                right: 10%;
                font-size: 3rem;
                animation: float-ghost 6s ease-in-out infinite;
                pointer-events: none;
                z-index: 1;
            }
        `;
    }

    getChristmasAnimations() {
        return `
            @keyframes snow-fall {
                0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            
            .snowflake {
                position: fixed;
                top: -10px;
                color: white;
                font-size: 1rem;
                animation: snow-fall linear infinite;
                pointer-events: none;
                z-index: 1;
            }
            
            body::after {
                content: '❄️ ❄️ ❄️';
                position: fixed;
                top: 0;
                width: 100%;
                animation: snow-fall 10s linear infinite;
                pointer-events: none;
                z-index: 1;
            }
        `;
    }

    getValentinesAnimations() {
        return `
            @keyframes heart-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes heart-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .heart-float {
                animation: heart-pulse 2s ease-in-out infinite, heart-float 3s ease-in-out infinite;
            }
        `;
    }

    getNewYearAnimations() {
        return `
            @keyframes confetti-fall {
                0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            
            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0); }
                50% { opacity: 1; transform: scale(1); }
            }
            
            .sparkle {
                animation: sparkle 1.5s ease-in-out infinite;
            }
        `;
    }

    getIndependenceAnimations() {
        return `
            @keyframes firework-burst {
                0% { transform: scale(0) rotate(0deg); opacity: 1; }
                100% { transform: scale(1.5) rotate(180deg); opacity: 0; }
            }
            
            @keyframes patriotic-glow {
                0%, 100% { box-shadow: 0 0 5px var(--color-primary); }
                33% { box-shadow: 0 0 5px var(--color-secondary); }
                66% { box-shadow: 0 0 5px var(--color-accent); }
            }
            
            .patriotic-element {
                animation: patriotic-glow 2s ease-in-out infinite;
            }
        `;
    }

    getDefaultAnimations() {
        return `
            @keyframes subtle-glow {
                0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
                50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
            }
            
            .glow-element {
                animation: subtle-glow 3s ease-in-out infinite;
            }
        `;
    }

    // Method to manually switch themes (for testing)
    setTheme(themeKey) {
        if (this.themes[themeKey]) {
            this.currentTheme = { key: themeKey, ...this.themes[themeKey] };
            this.applyTheme();
            this.initAnimations();
        }
    }
}

// Initialize holiday themes
const holidayThemes = new HolidayThemes();

// Export for global access
window.holidayThemes = holidayThemes;
