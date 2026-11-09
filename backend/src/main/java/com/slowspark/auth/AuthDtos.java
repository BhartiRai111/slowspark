package com.slowspark.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Request/response shapes for the login APIs. */
public final class AuthDtos {

    private AuthDtos() {}

    public record FirebaseLoginRequest(@NotBlank String idToken) {}

    public record DevLoginRequest(@NotBlank @Pattern(regexp = "\\+?[0-9]{10,13}") String phone) {}

    public record AuthResponse(String accessToken, Long userId, boolean onboardingComplete) {}
}
