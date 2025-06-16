package dev.anhhoang.QTCSDLHD.models;

import lombok.Data;

@Data
public class SellerProfile {
    private String shopName;
    private String shopLogoUrl;
    private String phoneNumber;
    private Address pickupAddress;
    private BankAccount bankAccount;
}