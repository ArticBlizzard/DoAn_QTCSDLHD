// src/main/java/dev/anhhoang/QTCSDLHD/models/BuyerProfile.java
package dev.anhhoang.QTCSDLHD.models;

import lombok.Data;
import java.util.List;

@Data
public class BuyerProfile {
    private String phoneNumber;
    private List<ShippingAddress> addresses;
}