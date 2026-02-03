import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export function Pagination({ links }: PaginationProps) {
    // Encontrar el índice de la página activa
    const activeIndex = links.findIndex(link => link.active);

    // Función para determinar si un enlace debe mostrarse en móvil
    const shouldShowOnMobile = (index: number, link: { label: string; active: boolean }) => {
        // Siempre mostrar anterior y siguiente
        if (link.label === '&laquo; Previous' || link.label === 'Next &raquo;') {
            return true;
        }
        // Mostrar la página activa
        if (link.active) {
            return true;
        }
        // Mostrar páginas adyacentes a la activa (1 antes y 1 después)
        if (activeIndex > 0 && (index === activeIndex - 1 || index === activeIndex + 1)) {
            return true;
        }
        return false;
    };

    return (
        <div className="flex items-center justify-center space-x-1 mt-6">
            {links.map((link, index) => {
                const showOnMobile = shouldShowOnMobile(index, link);

                if (link.label === '&laquo; Previous') {
                    return (
                        <Link key={index} href={link.url || '#'} preserveState>
                            <Button variant="outline" size="sm" disabled={!link.url}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                    );
                }

                if (link.label === 'Next &raquo;') {
                    return (
                        <Link key={index} href={link.url || '#'} preserveState>
                            <Button variant="outline" size="sm" disabled={!link.url}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    );
                }

                // Para números de página: ocultar en móvil si no es relevante
                return (
                    <Link
                        key={index}
                        href={link.url || '#'}
                        preserveState
                        className={showOnMobile ? '' : 'hidden sm:inline-flex'}
                    >
                        <Button
                            variant={link.active ? "default" : "outline"}
                            size="sm"
                            disabled={!link.url}
                        >
                            {link.label}
                        </Button>
                    </Link>
                );
            })}
        </div>
    );
}
