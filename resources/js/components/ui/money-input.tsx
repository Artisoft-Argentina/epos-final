import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface MoneyInputProps {
    value: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
    error?: string;
    className?: string;
    placeholder?: string;
    id?: string;
}

// Acepta dígitos con hasta 2 decimales (o vacío mientras se tipea).
const CURRENCY_RE = /^\d*\.?\d{0,2}$/;

/**
 * Input de moneda (ARS). Mantiene un buffer de texto para tipear cómodo
 * (permite vacío temporal, punto decimal) y emite el número por onValueChange.
 * Se sincroniza si el valor externo cambia (p. ej. pago automático por el total).
 */
export function MoneyInput({ value, onValueChange, disabled, error, className, placeholder = '0.00', id }: MoneyInputProps) {
    const [text, setText] = useState<string>(value ? String(value) : '');

    // Sincroniza el buffer cuando el valor externo difiere del texto actual.
    useEffect(() => {
        const parsed = parseFloat(text);
        const current = isNaN(parsed) ? 0 : parsed;
        if (current !== value) {
            setText(value ? String(value) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (raw: string) => {
        if (raw === '' || CURRENCY_RE.test(raw)) {
            setText(raw);
            const parsed = parseFloat(raw);
            onValueChange(isNaN(parsed) ? 0 : parsed);
        }
    };

    const handleBlur = () => {
        if (text === '') {
            onValueChange(0);
            return;
        }
        const parsed = parseFloat(text);
        const safe = isNaN(parsed) ? 0 : parsed;
        setText(safe.toFixed(2));
        onValueChange(safe);
    };

    return (
        <Input
            id={id}
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            error={error}
            className={cnRight(className)}
            startIcon={<span className="text-sm">$</span>}
        />
    );
}

// Alinea el monto a la derecha con tabular-nums, preservando className externa.
function cnRight(className?: string): string {
    return ['text-right tabular-nums', className].filter(Boolean).join(' ');
}
