package dev.anhhoang.QTCSDLHD.models;

import java.math.BigDecimal;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.Data;

@Data
@Document(collection = "products")
public class Product {
    @Id
    private String id;

    @Field("name")
    private String name;

    @Field("description")
    private String description;

    @Field("price")
    private BigDecimal price;

    @Field("image_url")
    private String imageUrl;

    @Field("category")
    private String category;

    @Field("stock")
    private Integer stock;

    @Field("seller_id")
    private String sellerId;

    @Field("seller_name")
    private String sellerName;

    public void setSellerId(String sellerId) {
        this.sellerId = sellerId;
    }

    public void setSellerName(String sellerName) {
        this.sellerName = sellerName;
    }


}
