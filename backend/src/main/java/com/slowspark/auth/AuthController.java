package com.slowspark.auth;

import com.slowspark.auth.AuthDtos.AuthResponse;
import com.slowspark.auth.AuthDtos.DevLoginRequest;
import com.slowspark.auth.AuthDtos.FirebaseLoginRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/auth/firebase  {"idToken": "..."} → our JWT */
    @PostMapping("/firebase")
    public AuthResponse firebaseLogin(@Valid @RequestBody FirebaseLoginRequest req) {
        return authService.loginWithFirebase(req.idToken());
    }

    /** POST /api/auth/dev-login  {"phone": "9876543210"} → our JWT (only when dev login is enabled) */
    @PostMapping("/dev-login")
    public AuthResponse devLogin(@Valid @RequestBody DevLoginRequest req) {
        return authService.devLogin(req.phone());
    }
}
