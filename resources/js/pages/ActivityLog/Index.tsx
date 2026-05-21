import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { DataTable, type Column } from '@/components/data-table';

interface Activity {
    id: number;
    log_name: string;
    description: string;
    subject_type: string;
    subject_id: number;
    created_at: string;
    causer?: { name: string };
}

interface Props {
    activities: { data: Activity[]; links: any[]; current_page: number; last_page: number };
}

export default function Index({ activities }: Props) {
    const getSubjectName = (activity: Activity) => {
        const type = activity.subject_type?.split('\\').pop();
        return `${type} #${activity.subject_id}`;
    };

    const columns: Column<Activity>[] = [
        {
            key: 'causer',
            header: 'Usuario',
            render: (row) => <span className="font-medium text-foreground">{row.causer?.name || 'Sistema'}</span>,
        },
        {
            key: 'description',
            header: 'Acción',
            render: (row) => <span className="text-foreground">{row.description}</span>,
        },
        {
            key: 'subject',
            header: 'Entidad',
            render: (row) => <Badge variant="secondary">{getSubjectName(row)}</Badge>,
        },
        {
            key: 'log_name',
            header: 'Módulo',
            render: (row) => <span className="text-muted-foreground capitalize">{row.log_name}</span>,
        },
        {
            key: 'created_at',
            header: 'Fecha',
            align: 'right',
            render: (row) => (
                <span className="text-muted-foreground tabular-nums text-xs">
                    {new Date(row.created_at).toLocaleString('es-AR')}
                </span>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Registro de Actividad" />
            <div className="flex flex-col gap-6 p-6">
                <PageHeader title="Registro de Actividad" description="Historial de operaciones del sistema" />
                <DataTable
                    columns={columns}
                    data={activities.data}
                    keyExtractor={(row) => row.id}
                    emptyMessage="No hay actividad registrada."
                />
            </div>
        </AppLayout>
    );
}
