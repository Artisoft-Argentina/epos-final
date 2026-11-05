import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void): () => void {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
}

/**
 * Si el viewport está en rango de teléfono.
 *
 * Usa `useSyncExternalStore` y no `useState` + `useEffect` para que el primer
 * render ya traiga el valor correcto. Antes arrancaba siempre en `false` y se
 * corregía en el efecto, así que en un teléfono se pintaba un frame de la
 * versión de escritorio —visible, por ejemplo, en el sidebar, que recién
 * después saltaba a `Sheet`—.
 *
 * El tercer argumento es el snapshot del servidor: React lo usa para hidratar y
 * vuelve a renderizar con el del cliente sin emitir un mismatch. Inicializar el
 * estado leyendo `window` directamente arreglaría el parpadeo, pero rompería la
 * hidratación el día que se prenda el SSR —que está configurado en
 * `config/inertia.php` aunque hoy no corra—.
 */
export function useIsMobile(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => window.innerWidth < MOBILE_BREAKPOINT,
        () => false,
    );
}
