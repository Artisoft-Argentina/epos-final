import { type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Column definition ───────────────────────────────────────────────────────

export interface Column<T> {
    key: string;
    header: string;
    align?: 'left' | 'right' | 'center';
    className?: string;
    render?: (row: T) => ReactNode;
}

// ─── DataTable ────────────────────────────────────────────────────────────────

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string | number;
    title?: string;
    description?: string;
    toolbar?: ReactNode;
    footer?: ReactNode;
    emptyMessage?: string;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    title,
    description,
    toolbar,
    footer,
    emptyMessage = 'No hay datos para mostrar.',
    className,
}: DataTableProps<T>) {
    return (
        <Card className={cn('gap-0 py-0', className)}>
            {(title || toolbar) && (
                <CardHeader className="px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between gap-4">
                        {title && (
                            <div>
                                <CardTitle className="text-base">{title}</CardTitle>
                                {description && (
                                    <CardDescription className="mt-0.5">{description}</CardDescription>
                                )}
                            </div>
                        )}
                        {toolbar && (
                            <div className="flex items-center gap-2 ml-auto">
                                {toolbar}
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'h-12 px-4 align-middle font-semibold text-muted-foreground text-sm',
                                        col.align === 'right' && 'text-right',
                                        col.align === 'center' && 'text-center',
                                        !col.align && 'text-left',
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground text-sm"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={keyExtractor(row)}
                                    className="bg-white hover:bg-gray-50 transition-colors"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'p-4 align-middle',
                                                col.align === 'right' && 'text-right',
                                                col.align === 'center' && 'text-center',
                                                col.className
                                            )}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as any)[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                    {footer ?? <span />}
                </div>
            </CardContent>
        </Card>
    );
}
