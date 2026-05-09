import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

interface ActionButtonProps extends VariantProps<typeof buttonVariants> {
    title: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    className?: string;
    children: ReactNode;
}

export function ActionButton({ title, onClick, disabled, className, children, variant = 'outline', size = 'icon' }: ActionButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={cn('size-8', className)}
                    onClick={onClick}
                    disabled={disabled}
                    aria-label={title}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{title}</TooltipContent>
        </Tooltip>
    );
}
