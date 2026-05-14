import { useRef, useState } from 'react';
import { ImagePlus, X, Star } from 'lucide-react';

interface PreviewItem {
    file: File;
    url: string;
}

interface ImageUploadPreviewProps {
    onChange: (files: File[], primaryIndex: number) => void;
}

export function ImageUploadPreview({ onChange }: ImageUploadPreviewProps) {
    const [items, setItems] = useState<PreviewItem[]>([]);
    const [primaryIndex, setPrimaryIndex] = useState(0);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const addFiles = (files: File[]) => {
        const valid = files.filter((f) => ACCEPTED.includes(f.type));
        if (!valid.length) return;

        setItems((prev) => {
            const next = [...prev, ...valid.map((file) => ({ file, url: URL.createObjectURL(file) }))];
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

    return (
        <div className="flex flex-col gap-4">
            {/* Drop zone */}
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
                    dragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/30 hover:bg-muted/50'
                }`}
            >
                <ImagePlus className={`size-5 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                    <p className="text-sm font-medium text-foreground">
                        {dragging ? 'Soltá las imágenes aquí' : 'Subir imágenes'}
                    </p>
                    <p className="text-xs text-muted-foreground">Arrastrá o hacé click — JPEG, PNG, GIF, WebP — Máx. 5 MB</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED.join(',')}
                    className="sr-only"
                    onChange={handleInput}
                />
            </div>

            {/* Previews */}
            {items.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {items.length} {items.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'} — hacé click en <Star className="inline size-3 mb-0.5" /> para elegir la principal
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

                                {/* Badge principal */}
                                {i === primaryIndex && (
                                    <span className="absolute top-1 left-1 flex items-center gap-1 text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                        <Star className="size-2.5 fill-current" />Principal
                                    </span>
                                )}

                                {/* Acciones en hover */}
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
