import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'AFIP Settings',
        href: '/settings/afip',
    },
];

export default function Afip() {
    const [certFile, setCertFile] = useState<File | null>(null);
    const [keyFile, setKeyFile] = useState<File | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AFIP Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title="Certificados AFIP" 
                        description="Sube los archivos de certificado y clave privada de AFIP" 
                    />

                    <Form
                        method="post"
                        action={route('afip.upload')}
                        encType="multipart/form-data"
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="cert_file">Certificado (.pem/.crt)</Label>
                                    <Input
                                        id="cert_file"
                                        type="file"
                                        name="cert_file"
                                        accept=".pem,.crt,.cert"
                                        onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                    <InputError className="mt-2" message={errors.cert_file} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="key_file">Clave privada (.pem/.key)</Label>
                                    <Input
                                        id="key_file"
                                        type="file"
                                        name="key_file"
                                        accept=".pem,.key"
                                        onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                    <InputError className="mt-2" message={errors.key_file} />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button 
                                        disabled={processing || !certFile || !keyFile}
                                        type="submit"
                                    >
                                        Subir certificados
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-green-600">Certificados subidos correctamente</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}