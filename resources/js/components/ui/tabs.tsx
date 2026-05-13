import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const TabsContext = React.createContext<{ variant: 'pill' | 'underline' }>({ variant: 'pill' })

function Tabs({
    variant = 'pill',
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & { variant?: 'pill' | 'underline' }) {
    return (
        <TabsContext.Provider value={{ variant }}>
            <TabsPrimitive.Root
                data-slot="tabs"
                className={cn('w-full', className)}
                {...props}
            />
        </TabsContext.Provider>
    )
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
    const { variant } = React.useContext(TabsContext)
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                variant === 'pill'
                    ? 'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground'
                    : 'flex overflow-x-auto border-b border-border space-x-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                className
            )}
            {...props}
        />
    )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    const { variant } = React.useContext(TabsContext)
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            className={cn(
                'text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                variant === 'pill'
                    ? 'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:text-foreground'
                    : 'whitespace-nowrap border-b-2 py-2 px-1 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:border-border',
                className
            )}
            {...props}
        />
    )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn('mt-4', className)}
            {...props}
        />
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
