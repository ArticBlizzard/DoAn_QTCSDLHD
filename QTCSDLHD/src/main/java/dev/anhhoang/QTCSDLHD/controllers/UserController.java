package dev.anhhoang.QTCSDLHD.controllers;

import dev.anhhoang.QTCSDLHD.dto.BecomeSellerRequest;
import dev.anhhoang.QTCSDLHD.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import dev.anhhoang.QTCSDLHD.dto.UserProfileResponse;
import org.springframework.web.bind.annotation.GetMapping;
import java.security.Principal;
import dev.anhhoang.QTCSDLHD.dto.UpdateSellerProfileRequest;
import org.springframework.security.access.prepost.PreAuthorize; // <-- Thêm import này
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/become-seller")
    public ResponseEntity<?> becomeSeller(@RequestBody BecomeSellerRequest request, Principal principal) {
        // The 'Principal' object is automatically populated by Spring Security
        // with the details of the currently authenticated user.
        // principal.getName() will return the username (in our case, the email).
        try {
            userService.becomeSeller(principal.getName(), request);
            return ResponseEntity.ok("Congratulations! You are now a seller.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUserProfile(Principal principal) {
        // principal.getName() gives us the email of the currently authenticated user
        UserProfileResponse userProfile = userService.findUserProfileByEmail(principal.getName());
        return ResponseEntity.ok(userProfile);
    }
    @PutMapping("/update-seller-profile")
    @PreAuthorize("hasRole('SELLER')") // Đảm bảo chỉ người bán mới có thể gọi API này
    public ResponseEntity<?> updateSellerProfile(@RequestBody UpdateSellerProfileRequest request, Principal principal) {
        try {
            userService.updateSellerProfile(principal.getName(), request);
            return ResponseEntity.ok("Seller profile updated successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}