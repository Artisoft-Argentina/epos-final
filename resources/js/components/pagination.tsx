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

    // Detectar si es botón de anterior o siguiente
    const isPrevious = (label: string) => label.includes('laquo') || label.toLowerCase().includes('previous') || label.toLowerCase().includes('anterior');
    const isNext = (label: string) => label.includes('raquo') || label.toLowerCase().includes('next') || label.toLowerCase().includes('siguiente');

    // Función para determinar si un enlace debe mostrarse en móvil
    const shouldShowOnMobile = (index: number, link: { label: string; active: boolean }) => {
        // Siempre mostrar anterior y siguiente
        if (isPrevious(link.label) || isNext(link.label)) {
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

                // Botón Anterior
                if (isPrevious(link.label)) {
                    if (!link.url) {
                        return (
                            <Button key={index} variant="outline" size="sm" disabled>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        );
                    }
                    return (
                        <Link key={index} href={link.url} preserveState>
                            <Button variant="outline" size="sm">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                    );
                }

                // Botón Siguiente
                if (isNext(link.label)) {
                    if (!link.url) {
                        return (
                            <Button key={index} variant="outline" size="sm" disabled>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        );
                    }
                    return (
                        <Link key={index} href={link.url} preserveState>
                            <Button variant="outline" size="sm">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    );
                }

                // Para números de página: ocultar en móvil si no es relevante
                if (!link.url) {
                    return (
                        <Button
                            key={index}
                            variant={link.active ? "default" : "outline"}
                            size="sm"
                            disabled
                            className={showOnMobile ? '' : 'hidden sm:inline-flex'}
                        >
                            {link.label}
                        </Button>
                    );
                }

                return (
                    <Link
                        key={index}
                        href={link.url}
                        preserveState
                        className={showOnMobile ? '' : 'hidden sm:inline-flex'}
                    >
                        <Button
                            variant={link.active ? "default" : "outline"}
                            size="sm"
                        >
                            {link.label}
                        </Button>
                    </Link>
                );
            })}
        </div>
    );
}
