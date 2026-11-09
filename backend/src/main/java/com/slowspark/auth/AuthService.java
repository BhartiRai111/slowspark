package com.slowspark.auth;

import com.google.firebase.auth.FirebaseToken;
import com.slowspark.auth.AuthDtos.AuthResponse;
import com.slowspark.common.ApiException;
import com.slowspark.security.JwtService;
import com.slowspark.user.User;
import com.slowspark.user.UserRepository;
import com.slowspark.user.UserStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Login flow:
 * 1. App logs in with Firebase (phone OTP or Google) and gets a Firebase ID token.
 * 2. App sends that token here. We verify it, find or create the user, and return our own JWT.
 */
@Service
public class AuthService {

    private final FirebaseTokenVerifier firebase;
    private final UserRepository users;
    private final JwtService jwtService;
    private final boolean devLoginEnabled;

    public AuthService(FirebaseTokenVerifier firebase, UserRepository users, JwtService jwtService,
                       @Value("${app.auth.dev-login-enabled}") boolean devLoginEnabled) {
        this.firebase = firebase;
        this.users = users;
        this.jwtService = jwtService;
        this.devLoginEnabled = devLoginEnabled;
    }

    @Transactional
    public AuthResponse loginWithFirebase(String idToken) {
        FirebaseToken token = firebase.verify(idToken);
        Object phone = token.getClaims().get("phone_number");
        User user = findOrCreate(token.getUid(), phone == null ? null : phone.toString(), token.getEmail(), token.getName());
        return issue(user);
    }

    /** Testing only: log in with a phone number, no OTP. Disabled unless DEV_LOGIN_ENABLED=true. */
    @Transactional
    public AuthResponse devLogin(String phone) {
        if (!devLoginEnabled) {
            throw ApiException.notFound("Not found");
        }
        User user = findOrCreate("dev-" + phone, phone, null, null);
        return issue(user);
    }

    private User findOrCreate(String uid, String phone, String email, String name) {
        return users.findByFirebaseUid(uid).orElseGet(() -> {
            User u = new User();
            u.setFirebaseUid(uid);
            u.setPhone(phone);
            u.setEmail(email);
            u.setName(name);
            return users.save(u);
        });
    }

    private AuthResponse issue(User user) {
        if (user.getStatus() == UserStatus.BANNED) {
            throw ApiException.forbidden("This account has been suspended");
        }
        user.setLastActive(Instant.now());
        return new AuthResponse(jwtService.generate(user.getId()), user.getId(), user.isOnboardingComplete());
    }
}
