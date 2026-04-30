import * as React from 'react'
import { UploadCloud, X, FileImage } from 'lucide-react'
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
    const [files, setFiles] = React.useState<File[]>([])

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList) return
        const arr = Array.from(fileList)
        setFiles(arr)
        onChange?.(fileList)
    }

    const removeFile = (index: number) => {
        const updated = files.filter((_, i) => i !== index)
        setFiles(updated)
        // Reconstruir DataTransfer para mantener sincronía
        const dt = new DataTransfer()
        updated.forEach((f) => dt.items.add(f))
        if (inputRef.current) inputRef.current.files = dt.files
        onChange?.(dt.files)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = () => setIsDragging(false)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (!disabled) handleFiles(e.dataTransfer.files)
    }

    return (
        <div className="space-y-2">
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
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </label>

            {files.length > 0 && (
                <ul className="space-y-1.5">
                    {files.map((file, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileImage className="size-4 text-muted-foreground shrink-0" />
                                <span className="truncate text-foreground">{file.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {(file.size / 1024).toFixed(0)} KB
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            >
                                <X className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export { FileUpload }
