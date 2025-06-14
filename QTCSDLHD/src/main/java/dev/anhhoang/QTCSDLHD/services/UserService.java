package dev.anhhoang.QTCSDLHD.services;
import dev.anhhoang.QTCSDLHD.dto.UserProfileResponse;
import dev.anhhoang.QTCSDLHD.dto.BecomeSellerRequest;
import dev.anhhoang.QTCSDLHD.models.Role;
import dev.anhhoang.QTCSDLHD.models.SellerProfile;
import dev.anhhoang.QTCSDLHD.models.User;
import dev.anhhoang.QTCSDLHD.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User becomeSeller(String userEmail, BecomeSellerRequest request) {
        // 1. Find the user by their email (which we get from the authenticated token)
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        // 2. Check if the user is already a seller
        if (user.getRoles().contains(Role.ROLE_SELLER)) {
            throw new RuntimeException("User is already a seller.");
        }

        // 3. Add the SELLER role to the user's existing roles
        user.getRoles().add(Role.ROLE_SELLER);

        // 4. Create a new SellerProfile from the request data
        SellerProfile sellerProfile = new SellerProfile();
        sellerProfile.setShopName(request.getShopName());
        sellerProfile.setPhoneNumber(request.getPhoneNumber());
        sellerProfile.setPickupAddress(request.getPickupAddress());
        sellerProfile.setBankAccount(request.getBankAccount());
        sellerProfile.setShopLogoUrl(request.getShopLogoUrl());

        // 5. Set the new seller profile on the user object
        user.setSellerProfile(sellerProfile);

        // 6. Save the updated user object to the database
        return userRepository.save(user);

    }
    public UserProfileResponse findUserProfileByEmail(String email) {
        // 1. Find the user entity from the database
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // 2. Create a new DTO object to hold the response data
        UserProfileResponse profileResponse = new UserProfileResponse();

        // 3. Manually map the data from the User entity to the DTO
        profileResponse.setId(user.getId());
        profileResponse.setEmail(user.getEmail());
        profileResponse.setFullName(user.getFullName());
        profileResponse.setRoles(user.getRoles());
        profileResponse.setBuyerProfile(user.getBuyerProfile());
        profileResponse.setSellerProfile(user.getSellerProfile());

        // 4. Return the DTO. The hashed password is never exposed.
        return profileResponse;
    }
}