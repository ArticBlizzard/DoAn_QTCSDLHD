package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.UserProfileResponse;
import dev.anhhoang.QTCSDLHD.dto.AuthResponse;
import dev.anhhoang.QTCSDLHD.dto.LoginRequest;
import dev.anhhoang.QTCSDLHD.dto.SignUpRequest;
import dev.anhhoang.QTCSDLHD.models.BuyerProfile;
import dev.anhhoang.QTCSDLHD.models.Role;
import dev.anhhoang.QTCSDLHD.models.User;
import dev.anhhoang.QTCSDLHD.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- MISSING CODE WAS HERE ---
    @Autowired
    private AuthenticationManager authenticationManager; // <-- THIS WAS MISSING

    @Autowired
    private UserDetailsServiceImpl userDetailsService; // <-- THIS WAS MISSING

    @Autowired
    private JwtUtil jwtUtil; // <-- THIS WAS MISSING
    // --- END OF MISSING CODE ---


    public User signUp(SignUpRequest signUpRequest) {
        // Check if a user with the email already exists
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(signUpRequest.getEmail());
        // IMPORTANT: Hash the password before saving!
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));

        // By default, every new user is a BUYER
        user.setRoles(new HashSet<>(Collections.singletonList(Role.ROLE_BUYER)));

        // Also create a default, empty buyer profile for them
        user.setBuyerProfile(new BuyerProfile());

        return userRepository.save(user);
    }

    // Add the new login method
    public AuthResponse login(LoginRequest loginRequest) {
        // Use Spring Security's AuthenticationManager to validate the username and password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        // If authentication is successful, load the user details
        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getEmail());

        // Generate a JWT token
        final String jwt = jwtUtil.generateToken(userDetails);

        // Return the token in our response object
        return new AuthResponse(jwt);
    }
}