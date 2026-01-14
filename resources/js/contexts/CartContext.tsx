import React, { createContext, useContext, useState } from 'react';

interface CartContextType {
    cartCount: number;
    setCartCount: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, initialCartCount = 0 }: { children: React.ReactNode; initialCartCount?: number; initialCartItems?: any[] }) {
    const [cartCount, setCartCount] = useState(initialCartCount);

    return (
        <CartContext.Provider value={{ cartCount, setCartCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
