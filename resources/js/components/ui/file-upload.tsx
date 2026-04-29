import * as React from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
    accept?: string
    multiple?: boolean
    disabled?: boolean
    onChange?: (files: FileList | null) => void
    className?: string
    hint?: string
}

function FileUpload({ accept, multiple, disabled, onChange, className, hint = 'PNG, JPG or PDF (MAX. 5MB)' }: FileUploadProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = React.useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = () => setIsDragging(false)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (!disabled) onChange?.(e.dataTransfer.files)
    }

    return (
        <label
            className={cn(
                'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                isDragging
                    ? 'border-primary bg-secondary'
                    : 'border-border bg-muted/40 hover:bg-muted/70',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex flex-col items-center justify-center gap-1 py-4">
                <UploadCloud className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">Click or drag and drop</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                className="hidden"
                onChange={(e) => onChange?.(e.target.files)}
            />
        </label>
    )
}

export { FileUpload }
