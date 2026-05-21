import { useRef, useState } from 'react';
import { ImagePlus, X, Star, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PreviewItem {
    file: File;
    url: string;
}

interface ImageUploadPreviewProps {
    onChange: (files: File[], primaryIndex: number) => void;
    maxFiles?: number;
    maxSizeMb?: number;
}

const MAX_FILES_DEFAULT = 5;
const MAX_SIZE_MB_DEFAULT = 5;

export function ImageUploadPreview({ onChange, maxFiles = MAX_FILES_DEFAULT, maxSizeMb = MAX_SIZE_MB_DEFAULT }: ImageUploadPreviewProps) {
    const [items, setItems] = useState<PreviewItem[]>([]);
    const [primaryIndex, setPrimaryIndex] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    const addFiles = (files: File[]) => {
        setError(null);

        const valid = files.filter((f) => ACCEPTED.includes(f.type));
        if (!valid.length) {
            setError('Formato no soportado. Usá JPEG, PNG, GIF o WebP.');
            return;
        }

        const oversized = valid.filter((f) => f.size > maxSizeBytes);
        if (oversized.length) {
            setError(`${oversized.length === 1 ? 'Una imagen excede' : `${oversized.length} imágenes exceden`} el límite de ${maxSizeMb} MB.`);
            return;
        }

        setItems((prev) => {
            const available = maxFiles - prev.length;
            if (available <= 0) {
                setError(`Máximo ${maxFiles} imágenes por producto.`);
                return prev;
            }

            const toAdd = valid.slice(0, available);
            if (toAdd.length < valid.length) {
                setError(`Solo se agregaron ${toAdd.length} de ${valid.length} imágenes. Máximo ${maxFiles} en total.`);
            }

            const next = [...prev, ...toAdd.map((file) => ({ file, url: URL.createObjectURL(file) }))];
            onChange(next.map((i) => i.file), primaryIndex);
            return next;
        });
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(e.target.files ?? []));
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const remove = (index: number) => {
        setError(null);
        setItems((prev) => {
            URL.revokeObjectURL(prev[index].url);
            const next = prev.filter((_, i) => i !== index);
            const newPrimary = index === primaryIndex
                ? 0
                : index < primaryIndex ? primaryIndex - 1 : primaryIndex;
            setPrimaryIndex(next.length ? newPrimary : 0);
            onChange(next.map((i) => i.file), next.length ? newPrimary : 0);
            return next;
        });
    };

    const setPrimary = (index: number) => {
        setPrimaryIndex(index);
        onChange(items.map((i) => i.file), index);
    };

    const isFull = items.length >= maxFiles;

    return (
        <div className="flex flex-col gap-4">
            {/* Error message */}
            {error && (
                <Alert variant="warning">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Drop zone */}
            <div
                onClick={() => !isFull && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!isFull) setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { if (isFull) { e.preventDefault(); setDragging(false); return; } handleDrop(e); }}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
                    isFull
                        ? 'border-border bg-muted/20 cursor-not-allowed opacity-60'
                        : dragging
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'border-border bg-muted/30 hover:bg-muted/50 cursor-pointer'
                }`}
            >
                <ImagePlus className={`size-5 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                    <p className="text-sm font-medium text-foreground">
                        {isFull ? `Límite alcanzado (${maxFiles} imágenes)` : dragging ? 'Soltá las imágenes aquí' : 'Subir imágenes'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {isFull ? 'Eliminá una imagen para agregar otra' : `JPEG, PNG, GIF, WebP — Máx. ${maxSizeMb} MB por archivo — Hasta ${maxFiles} imágenes`}
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED.join(',')}
                    className="sr-only"
                    onChange={handleInput}
                    disabled={isFull}
                />
            </div>

            {/* Previews */}
            {items.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {items.length}/{maxFiles} {items.length === 1 ? 'imagen' : 'imágenes'} — hacé click en <Star className="inline size-3 mb-0.5" /> para elegir la principal
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {items.map((item, i) => (
                            <div
                                key={item.url}
                                className={`relative group aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                                    i === primaryIndex ? 'border-primary' : 'border-border'
                                }`}
                            >
                                <img src={item.url} alt="" className="size-full object-cover" />

                                {i === primaryIndex && (
                                    <span className="absolute top-1 left-1 flex items-center gap-1 text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                        <Star className="size-2.5 fill-current" />Principal
                                    </span>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    {i !== primaryIndex && (
                                        <button
                                            type="button"
                                            onClick={() => setPrimary(i)}
                                            className="size-7 rounded-md bg-white text-foreground flex items-center justify-center hover:bg-muted transition-colors"
                                            title="Hacer principal"
                                        >
                                            <Star className="size-3.5" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => remove(i)}
                                        className="size-7 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                                        title="Eliminar"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
