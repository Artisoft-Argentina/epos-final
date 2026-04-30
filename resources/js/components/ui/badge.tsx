import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 gap-1 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-gray-100 text-gray-600",
        success:
          "border-transparent bg-emerald-100 text-emerald-800",
        warning:
          "border-transparent bg-amber-100 text-amber-800",
        destructive:
          "border-transparent bg-red-100 text-red-600",
        info:
          "border-transparent bg-blue-100 text-blue-700",
        pending:
          "border-transparent bg-indigo-100 text-indigo-700",
        outline:
          "border-border text-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps extends React.ComponentProps<"span">,
  VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  dot?: boolean;
}

function Badge({
  className,
  variant,
  asChild = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  const dotColor: Record<string, string> = {
    default: 'bg-primary',
    secondary: 'bg-gray-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    destructive: 'bg-red-500',
    info: 'bg-blue-500',
    pending: 'bg-indigo-500',
    outline: 'bg-foreground',
  }

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor[variant ?? 'default'])} />
      )}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
