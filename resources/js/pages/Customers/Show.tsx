import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Download, FileText, Edit, Mail, Phone, Smartphone, MapPin, User, Building2, Wallet, TrendingDown, CreditCard, ShoppingBag, ChevronRight, Receipt, StickyNote } from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';

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
    person_type: string;
    tax_id: string | null;
    dni: string | null;
    email: string | null;
    phone: string | null;
    cellphone: string | null;
    address: string | null;
    zip_code: string | null;
    tax_status: string;
    notes: string | null;
    active: boolean;
    credit: number;
    created_at: string;
    city: { id: number; name: string } | null;
    state: { id: number; name: string } | null;
}
interface Summary { total_sales: number; total_paid: number; balance_due: number; credit: number; }
interface Props { customer: Customer; sales: Sale[]; summary: Summary; }

const fmt = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex gap-3">
            <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm text-foreground">{value}</p>
            </div>
        </div>
    );
}

export default function Show({ customer, sales, summary }: Props) {
    const { can } = usePermission();

    const address = [customer.address, customer.city?.name, customer.state?.name, customer.zip_code]
        .filter(Boolean).join(', ');

    const salesColumns: Column<Sale>[] = [
        {
            key: 'created_at',
            header: 'Fecha',
            render: (row) => (
                <span className="text-sm tabular-nums text-foreground">
                    {new Date(row.created_at).toLocaleDateString('es-AR')}
                </span>
            ),
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            render: (row) => (
                <span className="font-medium tabular-nums text-foreground">{fmt(row.total)}</span>
            ),
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
                const balance = row.total - row.payments.reduce((s, p) => s + p.amount, 0);
                return (
                    <Badge variant={balance > 0 ? 'destructive' : 'success'}>
                        {fmt(balance)}
                    </Badge>
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

    const summaryCards = [
        { label: 'Total Ventas',    value: fmt(summary.total_sales), icon: ShoppingBag, iconBg: 'bg-primary/10',      iconColor: 'text-primary' },
        { label: 'Total Cobrado',   value: fmt(summary.total_paid),  icon: Wallet,      iconBg: 'bg-success-soft',    iconColor: 'text-success' },
        { label: 'Saldo Pendiente', value: fmt(summary.balance_due), icon: TrendingDown, iconBg: 'bg-destructive-soft', iconColor: 'text-destructive' },
        { label: 'Crédito a Favor', value: fmt(summary.credit),      icon: CreditCard,  iconBg: 'bg-info-soft',       iconColor: 'text-info' },
    ];

    return (
        <AppLayout>
            <Head title={customer.business_name} />
            <div className="flex flex-col gap-6 p-6">

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Link href={route('customers.index')} className="hover:text-primary transition-colors">Clientes</Link>
                    <ChevronRight className="size-3.5" />
                    <span className="text-foreground font-medium">{customer.business_name}</span>
                </div>

                <PageHeader
                    title={customer.business_name}
                    description={`Cliente desde ${new Date(customer.created_at).toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}`}
                    actions={
                        <div className="flex items-center gap-2">
                            <Badge variant={customer.active ? 'success' : 'secondary'} dot>
                                {customer.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {can('customers.export-excel') && (
                                <a href={route('customers.export-excel', customer.id)}>
                                    <Button variant="outline" size="sm"><Download className="size-4" /> Excel</Button>
                                </a>
                            )}
                            {can('customers.export-pdf') && (
                                <a href={route('customers.export-pdf', customer.id)}>
                                    <Button variant="outline" size="sm"><FileText className="size-4" /> PDF</Button>
                                </a>
                            )}
                            {can('customers.edit') && (
                                <Link href={route('customers.edit', customer.id)}>
                                    <Button size="sm"><Edit className="size-4" /> Editar</Button>
                                </Link>
                            )}
                        </div>
                    }
                />

                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {summaryCards.map((m) => (
                        <Card key={m.label} className="gap-0 py-0">
                            <CardContent className="px-4 py-4 flex flex-col gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className={`size-8 rounded-full ${m.iconBg} flex items-center justify-center`}>
                                        <m.icon className={`size-4 ${m.iconColor}`} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">{m.label}</span>
                                </div>
                                <p className="text-xl font-bold tabular-nums tracking-tight text-foreground">{m.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="general" variant="underline">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="history">Historial Comercial</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <Receipt className="size-4 text-primary" />
                                        Datos Fiscales
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5 flex flex-col gap-4">
                                    <InfoRow
                                        icon={customer.person_type === 'juridica' ? Building2 : User}
                                        label="Tipo"
                                        value={customer.person_type === 'juridica' ? 'Persona Jurídica' : 'Persona Física'}
                                    />
                                    {customer.tax_id && <InfoRow icon={CreditCard} label="CUIT / CUIL" value={customer.tax_id} />}
                                    {customer.dni    && <InfoRow icon={CreditCard} label="DNI"         value={customer.dni} />}
                                    <InfoRow icon={FileText} label="Condición IVA" value={customer.tax_status} />
                                </CardContent>
                            </Card>

                            <div className="flex flex-col gap-6">
                                <Card className="gap-0 py-0">
                                    <CardHeader className="border-b border-border px-6 py-4">
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                            <Phone className="size-4 text-primary" />
                                            Contacto
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 py-5 flex flex-col gap-4">
                                        {customer.email     && <InfoRow icon={Mail}       label="Email"    value={customer.email} />}
                                        {customer.phone     && <InfoRow icon={Phone}      label="Teléfono" value={customer.phone} />}
                                        {customer.cellphone && <InfoRow icon={Smartphone} label="Celular"  value={customer.cellphone} />}
                                        {!customer.email && !customer.phone && !customer.cellphone && (
                                            <p className="text-sm text-muted-foreground">Sin datos de contacto.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="gap-0 py-0">
                                    <CardHeader className="border-b border-border px-6 py-4">
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                            <MapPin className="size-4 text-primary" />
                                            Domicilio
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 py-5 flex flex-col gap-4">
                                        {address
                                            ? <InfoRow icon={MapPin} label="Dirección" value={address} />
                                            : <p className="text-sm text-muted-foreground">Sin domicilio registrado.</p>
                                        }
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="gap-0 py-0">
                                <CardHeader className="border-b border-border px-6 py-4">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <StickyNote className="size-4 text-primary" />
                                        Observaciones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-5">
                                    {customer.notes
                                        ? <p className="text-sm text-foreground whitespace-pre-wrap">{customer.notes}</p>
                                        : <p className="text-sm text-muted-foreground">Sin observaciones.</p>
                                    }
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <DataTable
                            columns={salesColumns}
                            data={sales}
                            keyExtractor={(row) => row.id}
                            title="Historial Comercial"
                            emptyMessage="No se encontraron ventas para este cliente."
                            footer={<p className="text-sm text-muted-foreground">{sales.length} registros</p>}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
