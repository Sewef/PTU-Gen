// Theme Manager
class ThemeManager {
    constructor() {
        this.themes = {
            light: { name: 'Light', class: 'light-mode' },
            dark: { name: 'Dark', class: 'dark-mode' },
            'solarized-dark': { name: 'Solarized Dark', class: 'solarized-dark' },
            'solarized-light': { name: 'Solarized Light', class: 'solarized-light' }
        };
        
        this.prankAlreadyPlayed = localStorage.getItem('theme-prank-played') === 'true';
        this.currentTheme = this.loadTheme();
        this.init();
    }
    
    loadTheme() {
        // Check localStorage first
        const saved = localStorage.getItem('theme');
        if (saved && this.themes[saved]) {
            return saved;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }
    
    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }
    
    setTheme(theme) {
        if (!this.themes[theme]) return;
        
        // Remove all theme classes
        Object.values(this.themes).forEach(t => {
            if (t.class) document.body.classList.remove(t.class);
        });
        
        // Add new theme class
        if (this.themes[theme].class) {
            document.body.classList.add(this.themes[theme].class);
        }
        
        // Update CSS color-scheme
        if (theme === 'light') {
            document.documentElement.style.colorScheme = 'light';
        } else if (theme === 'dark') {
            document.documentElement.style.colorScheme = 'dark';
        } else if (theme === 'solarized-dark') {
            document.documentElement.style.colorScheme = 'dark';
        } else if (theme === 'solarized-light') {
            document.documentElement.style.colorScheme = 'light';
        }
        
        this.currentTheme = theme;
        this.saveTheme(theme);
        this.updateThemeSelector();
    }
    
    init() {
        // Start with the opposite theme to tempt users into chasing the selector.
        const oppositeThemes = {
            light: 'dark',
            dark: 'light',
            'solarized-dark': 'solarized-light',
            'solarized-light': 'solarized-dark'
        };
        this.setTheme(this.prankAlreadyPlayed ? this.currentTheme : oppositeThemes[this.currentTheme]);
        // Remember immediately so even reloading during the chase won't repeat the prank.
        localStorage.setItem('theme-prank-played', 'true');
        
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    createThemeSelector() {
        const container = document.createElement('div');
        container.id = 'theme-selector-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
        `;
        
        const button = document.createElement('button');
        button.id = 'theme-toggle-btn';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', 'theme-menu');
        button.innerHTML = '🎨';
        
        // Create theme menu that appears on hover
        const menu = document.createElement('div');
        menu.id = 'theme-menu';
        menu.className = 'theme-menu';
        
        // Add options to menu
        Object.entries(this.themes).forEach(([key, theme]) => {
            const option = document.createElement('button');
            option.className = 'theme-option';
            if (key === this.currentTheme) {
                option.classList.add('active');
            }
            option.textContent = theme.name;
            option.addEventListener('click', () => {
                this.setTheme(key);
                this.updateThemeSelector();
            });
            menu.appendChild(option);
        });
        
        container.appendChild(button);
        container.appendChild(menu);
        
        // Keep menu visible when hovering over button or menu
        let hideTimeout;
        let dashAnimation;
        let dashCount = 0;
        let chaseTimeout;
        let chaseOver = this.prankAlreadyPlayed;
        
        const showMenu = () => {
            if (dashAnimation && !container.contains(document.activeElement)) return;
            clearTimeout(hideTimeout);
            const bounds = button.getBoundingClientRect();
            menu.style.bottom = bounds.top >= menu.offsetHeight + 20 ? '70px' : 'auto';
            menu.style.top = menu.style.bottom === 'auto' ? '70px' : 'auto';
            menu.style.left = bounds.left + menu.offsetWidth <= window.innerWidth - 12 ? '0' : 'auto';
            menu.style.right = menu.style.left === 'auto' ? '0' : 'auto';
            menu.classList.add('visible');
            button.setAttribute('aria-expanded', 'true');
        };
        
        const hideMenu = () => {
            hideTimeout = setTimeout(() => {
                if (container.contains(document.activeElement)) return;
                menu.classList.remove('visible');
                button.setAttribute('aria-expanded', 'false');
            }, 200);
        };
        
        container.addEventListener('mouseenter', showMenu);
        container.addEventListener('mouseleave', hideMenu);
        menu.addEventListener('mouseenter', showMenu);
        menu.addEventListener('mouseleave', hideMenu);
        button.addEventListener('click', showMenu);
        container.addEventListener('focusin', showMenu);
        container.addEventListener('focusout', hideMenu);
        container.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                button.focus();
                menu.classList.remove('visible');
                button.setAttribute('aria-expanded', 'false');
            }
        });

        // Mouse users have to chase it; touch and keyboard users can still choose a theme.
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const returnHome = () => {
            chaseOver = true;
            clearTimeout(chaseTimeout);
            // Let the current dash finish before heading home.
            if (dashAnimation) return;
            const start = container.getBoundingClientRect();
            container.style.left = '20px';
            container.style.top = 'auto';
            container.style.bottom = '20px';
            const home = container.getBoundingClientRect();
            dashAnimation = container.animate([
                { transform: `translate(${start.left - home.left}px, ${start.top - home.top}px)` },
                { transform: 'translate(0, 0)' }
            ], {
                duration: reducedMotion.matches ? 0 : 500,
                easing: 'cubic-bezier(0.45, 0, 0.15, 1)'
            });
            dashAnimation.onfinish = () => {
                dashAnimation = null;
                if (menu.classList.contains('visible') || container.matches(':hover')) showMenu();
            };
        };
        document.addEventListener('pointermove', event => {
            if (chaseOver || event.pointerType !== 'mouse' || reducedMotion.matches ||
                dashAnimation || container.contains(document.activeElement) || menu.classList.contains('visible')) return;

            const bounds = button.getBoundingClientRect();
            const distance = Math.hypot(
                event.clientX - (bounds.left + bounds.width / 2),
                event.clientY - (bounds.top + bounds.height / 2)
            );
            if (distance > 110) return;
            if (dashCount === 0) chaseTimeout = setTimeout(returnHome, 45000);
            dashCount++;

            const margin = 12;
            const maxX = Math.max(margin, window.innerWidth - bounds.width - margin);
            const maxY = Math.max(margin, window.innerHeight - bounds.height - margin);
            let destination;
            let bestDistance = -1;
            for (let attempt = 0; attempt < 12; attempt++) {
                const x = margin + Math.random() * (maxX - margin);
                const y = margin + Math.random() * (maxY - margin);
                const candidateDistance = Math.hypot(
                    event.clientX - (x + bounds.width / 2),
                    event.clientY - (y + bounds.height / 2)
                );
                if (candidateDistance > bestDistance) {
                    bestDistance = candidateDistance;
                    destination = { x, y };
                }
            }
            const start = container.getBoundingClientRect();
            container.style.left = `${destination.x}px`;
            container.style.top = `${destination.y}px`;
            container.style.bottom = 'auto';
            // Animate from the current position to the new one without changing layout each frame.
            dashAnimation = container.animate([
                { transform: `translate(${start.left - destination.x}px, ${start.top - destination.y}px)` },
                { transform: 'translate(0, 0)' }
            ], {
                duration: 360,
                easing: 'cubic-bezier(0.45, 0, 0.15, 1)'
            });
            dashAnimation.onfinish = () => {
                dashAnimation = null;
                if (chaseOver || dashCount >= 5) returnHome();
            };
        });
        window.addEventListener('resize', () => {
            dashAnimation?.cancel();
            dashAnimation = null;
            container.style.left = '20px';
            container.style.top = 'auto';
            container.style.bottom = '20px';
            if (menu.classList.contains('visible')) showMenu();
        });
        
        return container;
    }
    
    updateThemeSelector() {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(opt => {
            opt.classList.remove('active');
            if (opt.textContent === this.themes[this.currentTheme].name) {
                opt.classList.add('active');
            }
        });
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const themeManager = new ThemeManager();
        document.body.appendChild(themeManager.createThemeSelector());
    });
} else {
    const themeManager = new ThemeManager();
    document.body.appendChild(themeManager.createThemeSelector());
}
