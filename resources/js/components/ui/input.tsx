import * as React from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  success?: boolean;
  startIcon?: React.ReactNode;
}

function Input({ className, type, error, success, startIcon, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          data-slot="input"
          className={cn(
            "flex h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
            "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            startIcon && "pl-9",
            (error || success) && "pr-9",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
            success && "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30",
            className
          )}
          {...props}
        />
        {error && (
          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-destructive pointer-events-none" />
        )}
        {success && !error && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500 pointer-events-none" />
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export { Input }
