package com.slowspark.profile;

import com.slowspark.profile.ProfileDtos.*;
import com.slowspark.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** APIs for the logged-in user's own profile: /api/me/... */
@RestController
@RequestMapping("/api/me")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public MeResponse me() {
        return profileService.me(CurrentUser.id());
    }

    @PutMapping("/basic")
    public ResponseEntity<Void> basic(@Valid @RequestBody BasicInfoRequest req) {
        profileService.updateBasicInfo(CurrentUser.id(), req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/intent")
    public ResponseEntity<Void> intent(@Valid @RequestBody IntentRequest req) {
        profileService.updateIntent(CurrentUser.id(), req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/profile")
    public ResponseEntity<Void> profile(@Valid @RequestBody ProfileUpdateRequest req) {
        profileService.updateProfile(CurrentUser.id(), req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/photos")
    public ResponseEntity<Void> photos(@Valid @RequestBody PhotosRequest req) {
        profileService.updatePhotos(CurrentUser.id(), req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/location")
    public ResponseEntity<Void> location(@Valid @RequestBody LocationRequest req) {
        profileService.updateLocation(CurrentUser.id(), req);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/preferences")
    public ResponseEntity<Void> preferences(@Valid @RequestBody PreferencesRequest req) {
        profileService.updatePreferences(CurrentUser.id(), req);
        return ResponseEntity.noContent().build();
    }

    /** Last onboarding step. Fails with a clear message if something required is missing. */
    @PostMapping("/complete")
    public ResponseEntity<Void> complete() {
        profileService.completeOnboarding(CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
