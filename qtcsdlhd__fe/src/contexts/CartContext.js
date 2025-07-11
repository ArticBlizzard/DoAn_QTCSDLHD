import React, { createContext, useContext, useState, useCallback } from 'react';
import CartService from '../services/CartService';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
            const cartData = await CartService.getCart();
            setCart(cartData);
            setError('');
            return cartData;
        } catch (err) {
            setError('Không thể tải giỏ hàng');
            console.error('Error loading cart:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addToCart = useCallback(async (productId, quantity = 1) => {
        try {
            const updatedCart = await CartService.addToCart(productId, quantity);
            setCart(updatedCart);
            setError('');
            return updatedCart;
        } catch (err) {
            setError('Không thể thêm sản phẩm vào giỏ hàng');
            console.error('Error adding to cart:', err);
            throw err;
        }
    }, []);

    const updateQuantity = useCallback(async (productId, quantity) => {
        try {
            const updatedCart = await CartService.updateQuantity(productId, quantity);
            setCart(updatedCart);
            setError('');
            return updatedCart;
        } catch (err) {
            setError('Không thể cập nhật số lượng');
            console.error('Error updating quantity:', err);
            throw err;
        }
    }, []);

    const removeFromCart = useCallback(async (productId) => {
        try {
            const updatedCart = await CartService.removeFromCart(productId);
            setCart(updatedCart);
            setError('');
            return updatedCart;
        } catch (err) {
            setError('Không thể xóa sản phẩm');
            console.error('Error removing from cart:', err);
            throw err;
        }
    }, []);

    const clearCart = useCallback(async () => {
        try {
            await CartService.clearCart();
            setCart({ items: [], total: 0 });
            setError('');
        } catch (err) {
            setError('Không thể xóa giỏ hàng');
            console.error('Error clearing cart:', err);
            throw err;
        }
    }, []);

    const getCartCount = useCallback(() => {
        return cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
    }, [cart]);

    const value = {
        cart,
        loading,
        error,
        loadCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartCount,
        setError
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
