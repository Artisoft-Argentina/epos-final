import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    Breadcrumb, BreadcrumbList, BreadcrumbItem,
    BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
    CheckCircle, AlertTriangle, Info, XCircle,
    ShoppingCart, Package, Users,
    Edit, Eye, Trash2, Plus, Search, Download, Filter,
    Calendar, Smile, Calculator, Settings, User,
} from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">{title}</h2>
            {children}
        </div>
    );
}

export default function DesignSystem() {
    return (
        <AppLayout breadcrumbs={[{ title: 'Design System', href: '/design-system' }]}>
            <div className="space-y-12 p-6 max-w-5xl">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground">EPOS UI Kit</h1>
                    <p className="text-muted-foreground mt-1">Referencia visual de componentes — Design System v2</p>
                </div>

                {/* 1. Colors */}
                <Section title="1. Paleta de Colores">
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-3">Brand Colors</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Primary', bg: 'bg-primary', hex: '#0B7D6E' },
                                    { label: 'Background', bg: 'bg-background border border-border', hex: '#F7F8F8' },
                                    { label: 'Surface', bg: 'bg-card border border-border', hex: '#FFFFFF' },
                                    { label: 'Text Primary', bg: 'bg-foreground', hex: '#111111' },
                                ].map(({ label, bg, hex }) => (
                                    <div key={label}>
                                        <div className={`h-16 rounded-lg ${bg} mb-2`} />
                                        <p className="text-sm font-medium text-foreground">{label}</p>
                                        <p className="text-xs text-muted-foreground uppercase">{hex}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-3">Semantic Colors</p>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {[
                                    { label: 'Success', bg: 'bg-success', hex: '#10B981' },
                                    { label: 'Info', bg: 'bg-info', hex: '#3B82F6' },
                                    { label: 'Warning', bg: 'bg-warning', hex: '#F59E0B' },
                                    { label: 'Destructive', bg: 'bg-destructive', hex: '#EF4444' },
                                    { label: 'Pending', bg: 'bg-pending', hex: '#6366F1' },
                                ].map(({ label, bg, hex }) => (
                                    <div key={label}>
                                        <div className={`h-12 rounded-lg border ${bg} mb-2`} />
                                        <p className="text-xs font-medium text-foreground">{label}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{hex}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 2. Typography */}
                <Section title="2. Tipografía">
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <h1 className="text-4xl font-bold tracking-tight text-foreground">Heading 1</h1>
                                <p className="text-xs text-muted-foreground mt-1">Instrument Sans · Bold · 36px (text-4xl)</p>
                            </div>
                            <div>
                                <h2 className="text-3xl font-semibold tracking-tight text-foreground">Heading 2</h2>
                                <p className="text-xs text-muted-foreground mt-1">Instrument Sans · SemiBold · 30px (text-3xl)</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-medium tracking-tight text-foreground">Heading 3</h3>
                                <p className="text-xs text-muted-foreground mt-1">Instrument Sans · Medium · 24px (text-2xl)</p>
                            </div>
                            <div>
                                <p className="text-base leading-7 text-foreground">Body Text. The quick brown fox jumps over the lazy dog. This is a standard paragraph demonstrating the default body copy style for clear readability in enterprise applications.</p>
                                <p className="text-xs text-muted-foreground mt-1">Instrument Sans · Regular · 16px (text-base)</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Body Small — 14px Regular. Texto secundario, tablas, descripciones y metadata del sistema.</p>
                                <p className="text-xs text-muted-foreground mt-1">Instrument Sans · Regular · 14px (text-sm)</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Label — 12px Semibold · Headers de tabla, chips, metadata visual</p>
                                <p className="text-xs text-muted-foreground mt-1">Instrument Sans · SemiBold · 12px (text-xs)</p>
                            </div>
                        </CardContent>
                    </Card>
                </Section>

                {/* 3. Buttons */}
                <Section title="3. Botones">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex flex-wrap gap-3 items-center">
                                <Button>Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button disabled>Disabled</Button>
                            </div>
                            <Separator />
                            <div className="flex flex-wrap gap-3 items-center">
                                <Button size="lg"><Plus className="size-4" /> Nuevo</Button>
                                <Button><Plus className="size-4" /> Nuevo</Button>
                                <Button size="sm"><Plus className="size-4" /> Nuevo</Button>
                            </div>
                            <Separator />
                            <div className="flex flex-wrap gap-2 items-center">
                                <p className="text-sm text-muted-foreground w-full">Icon buttons (acciones en tabla)</p>
                                <Button variant="outline" size="icon" title="Ver"><Eye className="size-4" /></Button>
                                <Button variant="outline" size="icon" title="Editar"><Edit className="size-4" /></Button>
                                <Button variant="outline" size="icon" title="Descargar"><Download className="size-4" /></Button>
                                <Button variant="destructive-soft" size="icon" title="Eliminar"><Trash2 className="size-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                </Section>

                {/* 4. Badges */}
                <Section title="4. Badges">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Variantes</p>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <Badge variant="default" dot>Active</Badge>
                                    <Badge variant="secondary" dot>Inactive</Badge>
                                    <Badge variant="success" dot>Completado</Badge>
                                    <Badge variant="warning" dot>Pendiente</Badge>
                                    <Badge variant="destructive" dot>Error</Badge>
                                    <Badge variant="info" dot>En proceso</Badge>
                                    <Badge variant="pending" dot>Pending</Badge>
                                    <Badge variant="outline">Borrador</Badge>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Sin dot — uso en tablas</p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="success">Pagado</Badge>
                                    <Badge variant="warning">Pendiente de pago</Badge>
                                    <Badge variant="info">En preparación</Badge>
                                    <Badge variant="destructive">Stock crítico</Badge>
                                    <Badge variant="pending">En revisión</Badge>
                                    <Badge variant="outline">Borrador</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Section>

                {/* 5. Alerts */}
                <Section title="5. Alertas">
                    <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Standard Variant</p>
                        <Alert variant="info">
                            <Info className="size-4" />
                            <AlertTitle>Information</AlertTitle>
                            <AlertDescription>This is a default alert for general information.</AlertDescription>
                        </Alert>
                        <Alert variant="success">
                            <CheckCircle className="size-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>The operation was completed successfully.</AlertDescription>
                        </Alert>
                        <Alert variant="warning">
                            <AlertTriangle className="size-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>Please be careful, this action might have side effects.</AlertDescription>
                        </Alert>
                        <Alert variant="destructive">
                            <XCircle className="size-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>A system error occurred. Please try again later.</AlertDescription>
                        </Alert>
                    </div>
                </Section>

                {/* 6. Form Elements */}
                <Section title="6. Formularios">
                    <Card>
                        <CardContent className="pt-6 space-y-6">

                            {/* Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="demo-input">Input normal</Label>
                                    <Input id="demo-input" placeholder="Ej: Razón social" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="demo-search">Búsqueda</Label>
                                    <Input id="demo-search" startIcon={<Search className="size-4" />} placeholder="Buscar clientes..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="demo-error">Estado error</Label>
                                    <Input id="demo-error" error="El CUIT ingresado no es válido." defaultValue="Valor inválido" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="demo-success">Estado success</Label>
                                    <Input id="demo-success" success defaultValue="Valor correcto" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="demo-disabled">Deshabilitado</Label>
                                    <Input id="demo-disabled" disabled placeholder="No editable" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="demo-date">Date Picker</Label>
                                    <Input id="demo-date" type="date" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="demo-textarea">Textarea</Label>
                                <Textarea id="demo-textarea" placeholder="Observaciones de la venta..." />
                            </div>

                            <Separator />

                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label>File Upload</Label>
                                <FileUpload />
                            </div>

                            <Separator />

                            {/* Checkboxes & Switches */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-foreground">Checkboxes</p>
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="chk-unchecked" />
                                        <Label htmlFor="chk-unchecked">Unchecked</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="chk-checked" defaultChecked />
                                        <Label htmlFor="chk-checked">Checked</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="chk-disabled" disabled />
                                        <Label htmlFor="chk-disabled" className="opacity-50">Disabled</Label>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-foreground">Switch Toggles</p>
                                    <div className="flex items-center gap-3">
                                        <Switch id="sw-off" />
                                        <Label htmlFor="sw-off">Toggle Off</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch id="sw-on" defaultChecked />
                                        <Label htmlFor="sw-on">Toggle On</Label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch id="sw-disabled" disabled />
                                        <Label htmlFor="sw-disabled" className="opacity-50">Disabled</Label>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </Section>

                {/* 7. KPI Cards */}
                <Section title="7. KPI Cards">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Sales', value: '$24,500', sub: '+2.5k from last month', icon: ShoppingCart, trend: '+12%', trendVariant: 'success' as const },
                            { label: 'Artículos activos', value: '348', sub: '12 sin stock', icon: Package, trend: null, trendVariant: null },
                            { label: 'Clientes', value: '1.204', sub: '+8 esta semana', icon: Users, trend: '+8', trendVariant: 'success' as const },
                            { label: 'Low Stock', value: '18', sub: '3 items needing reorder', icon: Package, trend: '-4%', trendVariant: 'destructive' as const },
                        ].map(({ label, value, sub, icon: Icon, trend, trendVariant }) => (
                            <Card key={label} className="gap-0 py-0">
                                <CardContent className="p-4 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                                                <Icon className="size-4 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground">{label}</span>
                                        </div>
                                        {trend && trendVariant && (
                                            <Badge variant={trendVariant}>{trend}</Badge>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </Section>

                {/* 8. Table */}
                <Section title="8. Tabla de datos">
                    <Card className="gap-0 py-0">
                        <CardHeader className="px-6 py-4 border-b border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Ventas recientes</CardTitle>
                                    <CardDescription className="mt-0.5">Últimas 5 operaciones del sistema</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm"><Filter className="size-4" /> Filtrar</Button>
                                    <Button size="sm"><Plus className="size-4" /> Nueva venta</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="bg-muted/40 border-b border-border">
                                        <tr>
                                            {['Comprobante', 'Cliente', 'Estado', 'Método', 'Monto', 'Acciones'].map((h, i) => (
                                                <th key={h} className={`h-12 px-4 align-middle font-semibold text-muted-foreground text-sm${i === 0 ? ' pl-6' : ''}${i === 5 ? ' text-right pr-6' : ' text-left'}`}>
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {[
                                            { id: 'FAC-0001', cliente: 'Distribuidora Sur S.A.', estado: 'Pagado', estadoVariant: 'success' as const, metodo: 'Transferencia', total: '$45.200,00' },
                                            { id: 'FAC-0002', cliente: 'Comercial Norte', estado: 'Pendiente', estadoVariant: 'warning' as const, metodo: 'Cuenta corriente', total: '$12.800,00' },
                                            { id: 'FAC-0003', cliente: 'Ferretería Central', estado: 'En proceso', estadoVariant: 'info' as const, metodo: 'Efectivo', total: '$8.350,00' },
                                            { id: 'PRE-0041', cliente: 'Constructora Omega', estado: 'Borrador', estadoVariant: 'outline' as const, metodo: '—', total: '$67.000,00' },
                                            { id: 'FAC-0004', cliente: 'Mayorista del Este', estado: 'Vencido', estadoVariant: 'destructive' as const, metodo: 'Cheque', total: '$23.100,00' },
                                        ].map((row) => (
                                            <tr key={row.id} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="p-4 pl-6 font-medium text-foreground">{row.id}</td>
                                                <td className="p-4 text-foreground">{row.cliente}</td>
                                                <td className="p-4">
                                                    <Badge variant={row.estadoVariant}>{row.estado}</Badge>
                                                </td>
                                                <td className="p-4 text-muted-foreground">{row.metodo}</td>
                                                <td className="p-4 text-right font-medium tabular-nums text-foreground">{row.total}</td>
                                                <td className="p-4 pr-6">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="outline" size="icon" className="size-8" title="Ver"><Eye className="size-3.5" /></Button>
                                                        <Button variant="outline" size="icon" className="size-8" title="Editar"><Edit className="size-3.5" /></Button>
                                                        <Button variant="destructive-soft" size="icon" className="size-8" title="Eliminar"><Trash2 className="size-3.5" /></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                                <p className="text-sm text-muted-foreground">Showing 1 to 5 of 10 entries</p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>Previous</Button>
                                    <Button variant="outline" size="sm">Next</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Section>

                {/* 9. Dialog & Tooltip */}
                <Section title="9. Dialog &amp; Tooltip">
                    <Card>
                        <CardContent className="pt-6 space-y-8">

                            {/* Dialog */}
                            <div className="space-y-4">
                                <p className="text-xs font-medium text-muted-foreground">Dialog</p>
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button>Open Dialog</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-sm">
                                            <DialogHeader>
                                                <DialogTitle>Confirm Action</DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to proceed? This cannot be undone.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline">Cancel</Button>
                                                <Button>Confirm</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Static preview */}
                                    <div className="w-full max-w-sm border border-border rounded-lg shadow-md bg-white p-6 pointer-events-none">
                                        <h5 className="font-semibold text-foreground mb-1">Confirm Action</h5>
                                        <p className="text-sm text-muted-foreground mb-4">Are you sure you want to proceed? This cannot be undone.</p>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" tabIndex={-1}>Cancel</Button>
                                            <Button size="sm" tabIndex={-1}>Confirm</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Tooltip */}
                            <div className="space-y-4">
                                <p className="text-xs font-medium text-muted-foreground">Tooltip</p>
                                <div className="flex flex-wrap gap-6 items-center">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline">Hover me</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Tooltip text here
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon"><Eye className="size-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Ver detalle
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="destructive-soft" size="icon"><Trash2 className="size-4" /></Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Eliminar registro
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </Section>

                {/* 10. Command Palette */}
                <Section title="10. Command Palette">
                    <div className="max-w-md">
                        <Command>
                            <CommandInput placeholder="Type a command or search..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup heading="Suggestions">
                                    <CommandItem>
                                        <Calendar className="size-4 text-muted-foreground" />
                                        <span>Calendar</span>
                                        <CommandShortcut>⌘C</CommandShortcut>
                                    </CommandItem>
                                    <CommandItem>
                                        <Smile className="size-4 text-muted-foreground" />
                                        <span>Search Emoji</span>
                                    </CommandItem>
                                    <CommandItem>
                                        <Calculator className="size-4 text-muted-foreground" />
                                        <span>Calculator</span>
                                        <CommandShortcut>⌘K</CommandShortcut>
                                    </CommandItem>
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup heading="Settings">
                                    <CommandItem>
                                        <User className="size-4 text-muted-foreground" />
                                        <span>Profile</span>
                                        <CommandShortcut>⌘P</CommandShortcut>
                                    </CommandItem>
                                    <CommandItem>
                                        <Settings className="size-4 text-muted-foreground" />
                                        <span>Settings</span>
                                        <CommandShortcut>⌘S</CommandShortcut>
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </div>
                </Section>

                {/* 11. Navigation */}
                <Section title="11. Navigation">
                    <Card>
                        <CardContent className="pt-6 space-y-8">

                            {/* Breadcrumbs */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Breadcrumbs</p>
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href="#">Home</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href="#">Components</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Navigation</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                            </div>

                            <Separator />

                            {/* Pill Tabs */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Pill Tabs</p>
                                <Tabs defaultValue="overview" variant="pill">
                                    <TabsList>
                                        <TabsTrigger value="overview">Overview</TabsTrigger>
                                        <TabsTrigger value="settings">Settings</TabsTrigger>
                                        <TabsTrigger value="billing">Billing</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="overview">
                                        <p className="text-sm text-muted-foreground">Overview content goes here.</p>
                                    </TabsContent>
                                    <TabsContent value="settings">
                                        <p className="text-sm text-muted-foreground">Settings content goes here.</p>
                                    </TabsContent>
                                    <TabsContent value="billing">
                                        <p className="text-sm text-muted-foreground">Billing content goes here.</p>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <Separator />

                            {/* Underline Tabs */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Underline Tabs</p>
                                <Tabs defaultValue="home" variant="underline">
                                    <TabsList>
                                        <TabsTrigger value="home">Home</TabsTrigger>
                                        <TabsTrigger value="settings">Settings</TabsTrigger>
                                        <TabsTrigger value="billing">Billing</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="home">
                                        <p className="text-sm text-muted-foreground">Home content goes here.</p>
                                    </TabsContent>
                                    <TabsContent value="settings">
                                        <p className="text-sm text-muted-foreground">Settings content goes here.</p>
                                    </TabsContent>
                                    <TabsContent value="billing">
                                        <p className="text-sm text-muted-foreground">Billing content goes here.</p>
                                    </TabsContent>
                                </Tabs>
                            </div>

                        </CardContent>
                    </Card>
                </Section>

                {/* 12. Toast Notifications */}
                <Section title="12. Toast Notifications">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white border border-border shadow-md rounded-lg p-4 flex gap-3 items-start">
                            <CheckCircle className="size-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">Update successful</p>
                                <p className="text-sm text-muted-foreground mt-1">Your changes have been saved.</p>
                            </div>
                        </div>
                        <div className="bg-white border border-destructive/30 shadow-md rounded-lg p-4 flex gap-3 items-start">
                            <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-destructive">Connection failed</p>
                                <p className="text-sm text-muted-foreground mt-1">Unable to sync data right now.</p>
                            </div>
                        </div>
                        <div className="bg-white border border-border shadow-md rounded-lg p-4 flex gap-3 items-start">
                            <Info className="size-5 text-info shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">New update available</p>
                                <p className="text-sm text-muted-foreground mt-1">A new version is ready to install.</p>
                            </div>
                        </div>
                        <div className="bg-white border border-border shadow-md rounded-lg p-4 flex gap-3 items-start">
                            <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">Storage almost full</p>
                                <p className="text-sm text-muted-foreground mt-1">You've reached 90% of your capacity.</p>
                            </div>
                        </div>
                    </div>
                </Section>

            </div>
        </AppLayout>
    );
}
