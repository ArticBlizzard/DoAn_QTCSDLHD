package dev.anhhoang.QTCSDLHD.services;

import dev.anhhoang.QTCSDLHD.dto.UserProfileResponse;
import dev.anhhoang.QTCSDLHD.dto.AuthResponse;
import dev.anhhoang.QTCSDLHD.dto.LoginRequest;
import dev.anhhoang.QTCSDLHD.dto.SignUpRequest;
import dev.anhhoang.QTCSDLHD.models.BuyerProfile;
import dev.anhhoang.QTCSDLHD.models.Customer;
import dev.anhhoang.QTCSDLHD.models.Role;
import dev.anhhoang.QTCSDLHD.models.User;
import dev.anhhoang.QTCSDLHD.repositories.CustomerRepository;
import dev.anhhoang.QTCSDLHD.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomerRepository customerRepository;

    public User signUp(SignUpRequest signUpRequest) {
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        User user = new User();
        user.setFullName(signUpRequest.getFullName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        user.setRoles(new HashSet<>(Collections.singletonList(Role.ROLE_BUYER)));
        user.setBuyerProfile(new BuyerProfile());

        User savedUser = userRepository.save(user);

        // Create a corresponding Customer document
        Customer customer = new Customer();
        customer.set_id(savedUser.getId()); // Use the same ID as the User
        customer.setName(savedUser.getFullName());
        customer.setEmail(savedUser.getEmail());
        customer.setPassword(savedUser.getPassword()); // Store hashed password here too, or reference
        customer.setRank("Bronze"); // Default rank
        customer.setAddress(""); // Default empty address
        customer.setCart(new ArrayList<>());
        customer.setOrders(new ArrayList<>());
        customer.setCreated_at(LocalDateTime.now());
        customer.setUpdated_at(LocalDateTime.now());
        customerRepository.save(customer);

        return savedUser;
    }

    public AuthResponse login(LoginRequest loginRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getEmail());
        final String jwt = jwtUtil.generateToken(userDetails);

        return new AuthResponse(jwt);
    }
}