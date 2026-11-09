package com.slowspark.security;

import com.slowspark.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Small helper: CurrentUser.id() gives the logged-in user's id inside any controller or service. */
public final class CurrentUser {

    private CurrentUser() {}

    public static Long id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long userId) {
            return userId;
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Please log in again");
    }
}
