import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useToast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { Toaster } from 'sonner';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    useToast();
    
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <Toaster
                position="top-right"
                toastOptions={{
                    classNames: {
                        toast: 'bg-white border border-border shadow-md rounded-lg text-foreground font-sans text-sm',
                        title: 'font-semibold text-foreground',
                        description: 'text-muted-foreground text-sm',
                        success: 'border-border [&>[data-icon]]:text-success',
                        error: 'border-destructive/20 [&>[data-icon]]:text-destructive',
                        warning: 'border-warning/20 [&>[data-icon]]:text-warning',
                        info: 'border-info/20 [&>[data-icon]]:text-info',
                        actionButton: 'bg-primary text-primary-foreground',
                        cancelButton: 'bg-muted text-muted-foreground',
                        closeButton: 'border-border bg-white text-muted-foreground hover:text-foreground',
                    },
                }}
            />
        </AppShell>
    );
}
