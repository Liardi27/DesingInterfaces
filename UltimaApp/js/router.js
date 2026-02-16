
class Router {
    constructor() {
        this.routes = {
            'home': () => window.ui.renderHome(),
            'account': () => window.ui.renderAccount(),
            'add': () => window.ui.renderAddTransaction(),
            'stats': () => window.ui.renderStats(),
            'investments': () => window.ui.renderInvestments(),
            'piggybanks': () => window.ui.renderPiggyBanks(),
            'settings': (activeTab) => window.ui.renderSettings(activeTab),
            'login': () => window.ui.renderLogin(),
        };
        this.currentRoute = null;
    }

    init() {
        // Simple hash-based routing or default to home
        const initialRoute = 'home';
        this.navigate(initialRoute);
    }

    navigate(route, ...args) {
        // Simple Auth Guard detection
        const isAuth = (window.auth && window.auth.user) || (window.auth && window.auth.isGuest);

        // If system is not initialized yet (auth null), we might want to wait or let it slide to first load
        // But assuming auth is loaded quickly or we handle 'loading' state
        if (window.auth && !isAuth && route !== 'login') {
            route = 'login';
        }

        if (isAuth && route === 'login') {
            route = 'home';
        }

        this.currentRoute = route;

        // Hide sidebar/nav on login
        const sidebar = document.querySelector('aside');
        const bottomNav = document.querySelector('nav.fixed.bottom-0');
        const topbar = document.querySelector('header');

        if (route === 'login') {
            if (sidebar) sidebar.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            if (topbar) topbar.style.display = 'none';
            document.body.classList.add('login-mode');
        } else {
            if (sidebar) sidebar.style.display = 'flex'; // sidebar is flex
            if (bottomNav) bottomNav.style.display = 'flex';
            if (topbar) topbar.style.display = 'flex';
            document.body.classList.remove('login-mode');
        }

        if (this.routes[route]) {
            this.routes[route](...args);
            this.updateActiveNav(route);

            // Update Title
            const t = window.i18n ? (k) => window.i18n.t(k) : (k) => k;
            const titles = {
                'home': t('header_summary'),
                'account': t('nav_account'),
                'add': t('nav_new_movement'),
                'stats': t('nav_stats'),
                'investments': t('nav_investments'),
                'piggybanks': t('nav_piggybanks'),
                'settings': t('nav_settings'),
                'login': 'PocketFinance'
            };
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.innerText = titles[route] || 'PocketFinance';
        }
    }

    updateActiveNav(route) {
        // Reset all active states
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('nav-item-active');
            el.classList.remove('text-brand-primary'); // Legacy cleanup
            el.classList.remove('bg-blue-50'); // Legacy cleanup

            // Re-add muted if not active
            el.classList.add('text-brand-muted');
        });

        // Set active
        const links = document.querySelectorAll(`button[onclick="router.navigate('${route}')"]`);
        links.forEach(link => {
            // If it's a main nav item (has nav-item class), apply styles
            if (link.classList.contains('nav-item')) {
                link.classList.remove('text-brand-muted');
                link.classList.add('nav-item-active');
            }
        });
    }
}

window.Router = Router;
