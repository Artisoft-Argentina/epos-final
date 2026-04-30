import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface ComboboxOption {
    value: string
    label: string
}

interface ComboboxProps {
    options: ComboboxOption[]
    value?: string
    onValueChange?: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    disabled?: boolean
    error?: string
    className?: string
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = 'Seleccionar...',
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'No se encontraron resultados.',
    disabled,
    error,
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')

    const uniqueOptions = options
        .filter((o, i, arr) => arr.findIndex(x => x.value === o.value) === i)  // dedup por value
        .filter((o, i, arr) => arr.findIndex(x => x.label === o.label) === i)  // dedup por label
    const selected = uniqueOptions.find((o) => o.value === value)
    const filtered = search
        ? uniqueOptions.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : uniqueOptions

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch('') }}>
            <PopoverPrimitive.Trigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'flex h-10 w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error
                            ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30'
                            : 'border-input',
                        className
                    )}
                >
                    <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronsUpDown className="size-4 text-muted-foreground shrink-0 ml-2" />
                </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    className="z-50 w-[var(--radix-popover-trigger-width)] p-0 rounded-md border border-border bg-white shadow-md"
                    align="start"
                    sideOffset={4}
                >
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup>
                                {filtered.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => {
                                            onValueChange?.(option.value === value ? '' : option.value)
                                            setSearch('')
                                            setOpen(false)
                                        }}
                                    >
                                        <Check className={cn('size-4 mr-2 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')} />
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    )
}
