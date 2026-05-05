import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/data-table';
import { ChevronRight, Download, FileText, ArrowLeft } from 'lucide-react';

interface Payment { id: number; amount: number; }
interface Sale {
    id: number;
    created_at: string;
    total: number;
    payment_status: string;
    payments: Payment[];
}
interface Customer {
    id: number;
    business_name: string;
    fantasy_name: string | null;
    tax_id: string | null;
    dni: string | null;
    email: string | null;
    phone: string | null;
    tax_status: string;
    active: boolean;
    credit: number;
}
interface Summary {
    total_sales: number;
    total_paid: number;
    balance_due: number;
    credit: number;
}
interface Props { customer: Customer; sales: Sale[]; summary: Summary; }

const fmt = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

export default function AccountStatement({ customer, sales, summary }: Props) {
    const columns: Column<Sale>[] = [
        {
            key: 'created_at',
            header: 'Fecha',
            render: (row) => (
                <span className="text-sm text-muted-foreground tabular-nums">
                    {new Date(row.created_at).toLocaleDateString('es-AR')}
                </span>
            ),
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            render: (row) => <span className="font-medium tabular-nums">{fmt(row.total)}</span>,
        },
        {
            key: 'paid',
            header: 'Pagado',
            align: 'right',
            render: (row) => (
                <span className="tabular-nums text-muted-foreground">
                    {fmt(row.payments.reduce((s, p) => s + p.amount, 0))}
                </span>
            ),
        },
        {
            key: 'balance',
            header: 'Saldo',
            align: 'right',
            render: (row) => {
                const paid = row.payments.reduce((s, p) => s + p.amount, 0);
                const balance = row.total - paid;
                return (
                    <span className={`tabular-nums font-medium ${balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {fmt(balance)}
                    </span>
                );
            },
        },
        {
            key: 'payment_status',
            header: 'Estado',
            render: (row) => (
                <Badge variant={row.payment_status === 'SI' ? 'success' : 'warning'} dot>
                    {row.payment_status === 'SI' ? 'Pagado' : 'Pendiente'}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title={`Estado de Cuenta — ${customer.business_name}`} />
            <div className="flex flex-col gap-6 p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                            <Link href={route('customers.index')} className="hover:text-primary transition-colors">
                                Clientes
                            </Link>
                            <ChevronRight className="size-3.5" />
                            <span className="text-foreground font-medium">Estado de Cuenta</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{customer.business_name}</h1>
                        {customer.fantasy_name && (
                            <p className="text-sm text-muted-foreground mt-0.5">{customer.fantasy_name}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('customers.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="size-4" /> Volver
                            </Button>
                        </Link>
                        <a href={route('customers.account-statement.export-excel', customer.id)}>
                            <Button variant="outline" size="sm">
                                <Download className="size-4" /> Excel
                            </Button>
                        </a>
                        <a href={route('customers.account-statement.export-pdf', customer.id)}>
                            <Button variant="outline" size="sm">
                                <FileText className="size-4" /> PDF
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Customer info + summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="border-b border-border px-6 py-4">
                            <CardTitle className="text-base">Datos del Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 py-4 flex flex-col gap-2 text-sm">
                            {customer.tax_id && <div className="flex justify-between"><span className="text-muted-foreground">CUIT</span><span className="font-medium tabular-nums">{customer.tax_id}</span></div>}
                            {customer.dni && <div className="flex justify-between"><span className="text-muted-foreground">DNI</span><span className="font-medium tabular-nums">{customer.dni}</span></div>}
                            {customer.email && <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{customer.email}</span></div>}
                            {customer.phone && <div className="flex justify-between"><span className="text-muted-foreground">Teléfono</span><span className="font-medium">{customer.phone}</span></div>}
                            <div className="flex justify-between"><span className="text-muted-foreground">Condición IVA</span><span className="font-medium">{customer.tax_status}</span></div>
                            <div className="flex justify-between items-center pt-1 border-t border-border">
                                <span className="text-muted-foreground">Estado</span>
                                <Badge variant={customer.active ? 'success' : 'secondary'} dot>
                                    {customer.active ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Ventas', value: fmt(summary.total_sales), variant: 'default' },
                            { label: 'Total Cobrado', value: fmt(summary.total_paid), variant: 'success' },
                            { label: 'Saldo Pendiente', value: fmt(summary.balance_due), variant: summary.balance_due > 0 ? 'destructive' : 'success' },
                            { label: 'Crédito a Favor', value: fmt(summary.credit), variant: 'info' },
                        ].map((metric) => (
                            <Card key={metric.label}>
                                <CardContent className="px-5 py-4">
                                    <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                                    <p className="text-xl font-bold tabular-nums text-foreground">{metric.value}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sales table */}
                <DataTable
                    columns={columns}
                    data={sales}
                    keyExtractor={(row) => row.id}
                    title="Historial de Ventas"
                    emptyMessage="No se encontraron ventas para este cliente."
                    footer={
                        <p className="text-sm text-muted-foreground">{sales.length} registros</p>
                    }
                />
            </div>
        </AppLayout>
    );
}
