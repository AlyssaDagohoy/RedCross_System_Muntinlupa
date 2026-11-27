import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import IntroSplash from './Components/IntroSplash';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        /* rcBackTrap: after logout, Back on the login page stays on the login page */
        if (typeof window !== 'undefined' && !window.__rcBackTrap) {
            window.__rcBackTrap = true;
            const pathOf = (u) => { try { return new URL(String(u), window.location.origin).pathname; } catch (err) { return ''; } };
            let rcGuest = !props.initialPage?.props?.auth?.user;
            let rcPath = window.location.pathname;
            let rcSkip = false;
            router.on('navigate', (e) => {
                const p = e && e.detail && e.detail.page;
                if (!p) return;
                rcGuest = !(p.props && p.props.auth && p.props.auth.user);
                rcPath = pathOf(p.url);
            });
            window.addEventListener('popstate', (e) => {
                if (rcSkip) { rcSkip = false; e.stopImmediatePropagation(); return; }
                if (!rcGuest || !/^\/login\/?$/.test(rcPath)) return;
                if (/^\/(login|register|forgot-password|reset-password)/.test(window.location.pathname)) return;
                e.stopImmediatePropagation();
                rcSkip = true;
                setTimeout(() => { rcSkip = false; }, 600);
                try { window.history.go(1); } catch (err) { rcSkip = false; }
            }, true);
        }

        root.render(<><IntroSplash authed={!!props.initialPage?.props?.auth?.user} /><App {...props} /></>);
    },
    progress: {
        color: '#4B5563',
    },
});
