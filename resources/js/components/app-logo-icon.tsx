import { type ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/isotipo.png"
            alt="Logo"
            className={className}
            {...props}
        />
    );
}
