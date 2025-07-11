package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.ProductResponse;
import dev.anhhoang.QTCSDLHD.models.Product;
import dev.anhhoang.QTCSDLHD.repositories.ProductRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.Optional;

@Service
public class ProductCacheService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private ProductRepository productRepository;
    
    private static final String PRODUCT_CACHE_KEY = "product:";
    private static final long CACHE_EXPIRATION_HOURS = 24; // Cache expire sau 24 giờ
    
    /**
     * Lấy sản phẩm từ cache, nếu không có thì lấy từ database và cache lại
     */
    public ProductResponse getProductFromCache(String productId) {
        String cacheKey = PRODUCT_CACHE_KEY + productId;
        
        // Tìm trong cache trước
        ProductResponse cachedProduct = (ProductResponse) redisTemplate.opsForValue().get(cacheKey);
        
        if (cachedProduct != null) {
            System.out.println("Product found in cache: " + productId);
            return cachedProduct;
        }
        
        // Nếu không có trong cache, lấy từ database
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            ProductResponse productResponse = new ProductResponse();
            BeanUtils.copyProperties(product, productResponse);
            
            // Cache sản phẩm
            cacheProduct(productResponse);
            System.out.println("Product cached from database: " + productId);
            return productResponse;
        }
        
        return null;
    }
    
    /**
     * Cache sản phẩm vào Redis
     */
    public void cacheProduct(ProductResponse product) {
        String cacheKey = PRODUCT_CACHE_KEY + product.get_id();
        redisTemplate.opsForValue().set(cacheKey, product, CACHE_EXPIRATION_HOURS, TimeUnit.HOURS);
    }
    
    /**
     * Xóa sản phẩm khỏi cache (khi sản phẩm được cập nhật)
     */
    public void evictProductFromCache(String productId) {
        String cacheKey = PRODUCT_CACHE_KEY + productId;
        redisTemplate.delete(cacheKey);
        System.out.println("Product evicted from cache: " + productId);
    }
    
    /**
     * Cập nhật thông tin sản phẩm trong cache
     */
    public void updateProductInCache(String productId, ProductResponse product) {
        evictProductFromCache(productId);
        cacheProduct(product);
    }
    
    /**
     * Kiểm tra xem sản phẩm có tồn tại trong cache không
     */
    public boolean isProductInCache(String productId) {
        String cacheKey = PRODUCT_CACHE_KEY + productId;
        return redisTemplate.hasKey(cacheKey);
    }
}
