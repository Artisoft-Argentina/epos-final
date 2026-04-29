import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import {
    DollarSign,
    Users,
    TrendingUp,
    AlertTriangle,
    Plus,
    Package,
    Download,
    CalendarDays,
    Filter,
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

interface DashboardProps {
    totalVentas: number;
    clientesNuevos: number;
    ventasDelMes: number;
    saldoImpagas: number;
    productosVendidos: Array<{
        name: string;
        total_vendido: number;
    }>;
    ventasPorDia: Array<{
        dia: string;
        total_dia: number;
    }>;
    ventasPorVendedor: Array<{
        name: string;
        total_ventas: number;
        monto_total: string;
    }>;
    fechaInicio: string;
    fechaFin: string;
}

const kpiCards = [
    {
        key: 'totalVentas',
        label: 'Total Ventas',
        icon: DollarSign,
        format: 'currency',
        colorClass: 'bg-primary/10 text-primary',
    },
    {
        key: 'clientesNuevos',
        label: 'Clientes Nuevos',
        icon: Users,
        format: 'number',
        colorClass: 'bg-info-soft text-info',
    },
    {
        key: 'ventasDelMes',
        label: 'Ventas del Mes',
        icon: TrendingUp,
        format: 'currency',
        colorClass: 'bg-success-soft text-success',
    },
    {
        key: 'saldoImpagas',
        label: 'Saldo Impagas',
        icon: AlertTriangle,
        format: 'currency',
        colorClass: 'bg-destructive/10 text-destructive',
        valueClass: 'text-destructive',
    },
] as const;

function formatValue(value: number, format: string) {
    if (format === 'currency') return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    return value.toLocaleString();
}

const Dashboard: React.FC<DashboardProps> = ({
    totalVentas,
    clientesNuevos,
    ventasDelMes,
    saldoImpagas,
    productosVendidos,
    ventasPorDia,
    ventasPorVendedor,
    fechaInicio,
    fechaFin,
}) => {
    const { auth } = usePage<SharedData>().props;
    const [startDate, setStartDate] = useState(fechaInicio);
    const [endDate, setEndDate] = useState(fechaFin);
    const [showFilters, setShowFilters] = useState(false);

    const values: Record<string, number> = { totalVentas, clientesNuevos, ventasDelMes, saldoImpagas };

    const handleFilter = () => {
        router.get('/dashboard', { fecha_inicio: startDate, fecha_fin: endDate });
    };

    const firstName = auth.user.name.split(' ')[0];

    // Chart.js theme colors (teal palette)
    const chartTeal = 'rgba(15, 118, 110, 1)';       // teal-700
    const chartTealSoft = 'rgba(15, 118, 110, 0.15)';
    const chartColors = [
        'rgba(15, 118, 110, 0.9)',   // teal-700
        'rgba(5, 150, 105, 0.9)',    // emerald-600
        'rgba(59, 130, 246, 0.8)',   // blue-500
        'rgba(217, 119, 6, 0.8)',    // amber-600
        'rgba(220, 38, 38, 0.8)',    // red-600
        'rgba(13, 148, 136, 0.7)',   // teal-600
        'rgba(16, 185, 129, 0.7)',   // emerald-500
        'rgba(99, 102, 241, 0.7)',   // indigo-500
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Welcome Header + Quick Actions */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                            ¡Hola, {firstName}!
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Resumen de tu negocio del {new Date(fechaInicio).toLocaleDateString('es-AR')} al{' '}
                            {new Date(fechaFin).toLocaleDateString('es-AR')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => router.visit(route('ventas.create'))}>
                            <Plus className="size-4" />
                            Nueva venta
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => router.visit(route('articulos.create'))}>
                            <Package className="size-4" />
                            Añadir artículo
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="size-4" />
                            Filtros
                        </Button>
                    </div>
                </div>

                {/* Collapsible Date Filter */}
                {showFilters && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-end gap-3 sm:flex-row">
                                <div className="flex flex-1 items-center gap-2">
                                    <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="flex-1"
                                    />
                                    <span className="text-muted-foreground text-sm">a</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleFilter} size="sm">
                                        Aplicar
                                    </Button>
                                    <a href={route('dashboard.export', { fecha_inicio: startDate, fecha_fin: endDate })}>
                                        <Button variant="outline" size="sm">
                                            <Download className="size-4" />
                                            Excel
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpiCards.map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                            <Card key={kpi.key}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className={`flex size-10 items-center justify-center rounded-xl ${kpi.colorClass}`}>
                                            <Icon className="size-5" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                            {kpi.label}
                                        </p>
                                        <p className={`mt-1 text-2xl font-bold tabular-nums ${kpi.valueClass ?? ''}`}>
                                            {formatValue(values[kpi.key], kpi.format)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Charts Section */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Ventas por Día — Line Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Tendencia de Ventas</CardTitle>
                                    <p className="text-muted-foreground text-sm">Ventas diarias en el período</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                {ventasPorDia.length > 0 ? (
                                    <Line
                                        data={{
                                            labels: ventasPorDia.map((v) => {
                                                const f = v.dia.split('-');
                                                return `${f[2]}/${f[1]}`;
                                            }),
                                            datasets: [
                                                {
                                                    label: 'Ventas',
                                                    data: ventasPorDia.map((v) => v.total_dia),
                                                    borderColor: chartTeal,
                                                    backgroundColor: chartTealSoft,
                                                    tension: 0.3,
                                                    fill: true,
                                                    pointBackgroundColor: chartTeal,
                                                    pointBorderColor: '#fff',
                                                    pointBorderWidth: 2,
                                                    pointRadius: 4,
                                                    pointHoverRadius: 6,
                                                },
                                            ],
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: { color: 'rgba(0,0,0,0.04)' },
                                                    ticks: {
                                                        callback: (value) => '$' + Number(value).toLocaleString(),
                                                    },
                                                },
                                                x: {
                                                    grid: { display: false },
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <div className="text-muted-foreground flex h-full items-center justify-center">
                                        No hay ventas en el período seleccionado
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Productos Más Vendidos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos Más Vendidos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {productosVendidos.length > 0 ? (
                                    productosVendidos.map((producto, index) => (
                                        <div key={index} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="truncate text-sm">{producto.name}</span>
                                            </div>
                                            <Badge variant="secondary" className="shrink-0 tabular-nums">
                                                {producto.total_vendido}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">Sin datos en el período</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Ventas por Vendedor — Pie Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Ventas por Vendedor</CardTitle>
                                    <p className="text-muted-foreground text-sm">Distribución de montos en el período</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {ventasPorVendedor.length > 0 ? (
                                    <Pie
                                        data={{
                                            labels: ventasPorVendedor.map((v) => v.name),
                                            datasets: [
                                                {
                                                    label: 'Monto de Ventas',
                                                    data: ventasPorVendedor.map((v) => parseFloat(v.monto_total)),
                                                    backgroundColor: chartColors.slice(0, ventasPorVendedor.length),
                                                    borderColor: '#fff',
                                                    borderWidth: 2,
                                                },
                                            ],
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                    labels: { padding: 16, usePointStyle: true },
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (ctx) => {
                                                            const v = ventasPorVendedor[ctx.dataIndex];
                                                            return `${ctx.label}: $${Number(ctx.parsed).toLocaleString()} (${v.total_ventas} ventas)`;
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                ) : (
                                    <div className="text-muted-foreground flex h-full items-center justify-center">
                                        No hay datos de vendedores en el período
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Sidebar */}
                    <div className="space-y-4">
                        {/* Resumen del Período */}
                        <Card className="bg-primary text-primary-foreground border-0">
                            <CardContent className="pt-6">
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                                    Resumen del Período
                                </p>
                                <p className="mt-2 text-2xl font-bold">
                                    ${totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="mt-1 text-sm opacity-90">en ventas totales</p>
                                <div className="mt-4 flex items-center justify-between text-sm">
                                    <span className="opacity-80">{clientesNuevos} clientes nuevos</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Cobranzas */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Estado de Cobranzas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Cobrado</span>
                                        <span className="text-sm font-bold tabular-nums text-success">
                                            ${(totalVentas - saldoImpagas).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Pendiente</span>
                                        <span className="text-sm font-bold tabular-nums text-destructive">
                                            ${saldoImpagas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {totalVentas > 0 && (
                                        <div className="mt-2">
                                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                                <div
                                                    className="bg-primary h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.round(((totalVentas - saldoImpagas) / totalVentas) * 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {Math.round(((totalVentas - saldoImpagas) / totalVentas) * 100)}% cobrado
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
