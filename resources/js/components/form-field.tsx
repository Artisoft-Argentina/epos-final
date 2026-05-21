import { type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    className?: string;
    children: ReactNode;
}

export function FormField({ label, htmlFor, error, hint, required, className, children }: FormFieldProps) {
    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={htmlFor}>
                {label}{required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
            {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}
