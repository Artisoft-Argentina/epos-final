import { Input } from '@/components/ui/input';

/** Atajo de teclado visible, como el que la pantalla muestra junto a F2 y F3. */
export function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[0.7rem] font-medium text-muted-foreground sm:inline-block">
            {children}
        </kbd>
    );
}

/** Campo de porcentaje chico, para recargo y descuento sobre el subtotal. */
export function PercentInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
    return (
        <div className="relative w-[76px]">
            <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={label}
                className="h-8 [appearance:textfield] pr-6 text-right text-sm tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
        </div>
    );
}
