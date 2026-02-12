// Theme Manager
class ThemeManager {
    constructor() {
        this.themes = {
            light: { name: 'Light', class: 'light-mode' },
            dark: { name: 'Dark', class: 'dark-mode' },
            'solarized-dark': { name: 'Solarized Dark', class: 'solarized-dark' },
            'solarized-light': { name: 'Solarized Light', class: 'solarized-light' }
        };
        
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
        // Apply saved theme on page load
        this.setTheme(this.currentTheme);
        
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
        
        const showMenu = () => {
            clearTimeout(hideTimeout);
            menu.classList.add('visible');
        };
        
        const hideMenu = () => {
            hideTimeout = setTimeout(() => {
                menu.classList.remove('visible');
            }, 200);
        };
        
        container.addEventListener('mouseenter', showMenu);
        container.addEventListener('mouseleave', hideMenu);
        menu.addEventListener('mouseenter', showMenu);
        menu.addEventListener('mouseleave', hideMenu);
        
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
