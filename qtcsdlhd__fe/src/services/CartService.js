// src/services/CartService.js
import apiClient from '../api/AxiosConfig';

class CartService {
    // Get cart
    async getCart() {
        try {
            const response = await apiClient.get('/api/cart');
            return response.data;
        } catch (error) {
            console.error('Error getting cart:', error);
            throw error;
        }
    }

    // Add item to cart
    async addToCart(productId, quantity = 1) {
        try {
            const response = await apiClient.post('/api/cart/add', {
                productId,
                quantity
            });
            return response.data;
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw error;
        }
    }

    // Update item quantity
    async updateQuantity(productId, quantity) {
        try {
            const response = await apiClient.put('/api/cart/update', {
                productId,
                quantity
            });
            return response.data;
        } catch (error) {
            console.error('Error updating cart item:', error);
            throw error;
        }
    }

    // Remove item from cart
    async removeFromCart(productId) {
        try {
            const response = await apiClient.delete(`/api/cart/remove/${productId}`);
            return response.data;
        } catch (error) {
            console.error('Error removing from cart:', error);
            throw error;
        }
    }

    // Clear cart
    async clearCart() {
        try {
            const response = await apiClient.delete('/api/cart/clear');
            return response.data;
        } catch (error) {
            console.error('Error clearing cart:', error);
            throw error;
        }
    }

    // Get cart item count
    async getCartCount() {
        try {
            const response = await apiClient.get('/api/cart/count');
            return response.data.count;
        } catch (error) {
            console.error('Error getting cart count:', error);
            return 0;
        }
    }
}

const cartService = new CartService();
export default cartService;
