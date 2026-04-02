import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configurar axios para incluir CSRF token
// axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// const token = document.head.querySelector('meta[name="csrf-token"]');
// if (token) {
//     axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
// }

// Manejar errores 419 (CSRF token expirado) recargando la página
// router.on('invalid', (event) => {
//     const response = event.detail.response;
//     if (response.status === 419) {
//         event.preventDefault();
//         window.location.reload();
//     }
// });

// Interceptor de axios para errores 419
// axios.interceptors.response.use(
//     response => response,
//     error => {
//         if (error.response?.status === 419) {
//             window.location.reload();
//         }
//         return Promise.reject(error);
//     }
// );

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
