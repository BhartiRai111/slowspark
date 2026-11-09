package com.slowspark.profile;

import com.slowspark.user.Gender;
import com.slowspark.user.Intent;
import com.slowspark.user.InterestedIn;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Request and response shapes for profile APIs. */
public final class ProfileDtos {

    private ProfileDtos() {}

    // ---------- Requests ----------

    /** Onboarding screen 3: basic info. */
    public record BasicInfoRequest(
            @NotBlank @Size(min = 2, max = 60) String name,
            @NotNull @Past LocalDate dob,
            @NotNull Gender gender,
            @NotNull InterestedIn interestedIn,
            @Size(max = 80) String city,
            @Size(max = 60) String state) {}

    /** Onboarding screen 4: "Aap SlowSpark pe kyun ho?" */
    public record IntentRequest(@NotNull Intent intent) {}

    public record PromptAnswer(@NotNull Long promptId, @NotBlank @Size(max = 250) String answer) {}

    /** Onboarding screen 5 and Edit Profile: all "About me" fields are optional. */
    public record ProfileUpdateRequest(
            @Size(max = 300) String bio,
            @Min(120) @Max(230) Integer heightCm,
            @Size(max = 30) String education,
            @Size(max = 120) String college,
            @Size(max = 80) String jobTitle,
            @Size(max = 80) String company,
            @Size(max = 80) String hometown,
            @Size(max = 30) String religion,
            @Size(max = 20) String zodiac,
            @Size(max = 20) String drinking,
            @Size(max = 20) String smoking,
            @Size(max = 20) String workout,
            @Size(max = 20) String diet,
            @Size(max = 20) String pets,
            @Size(max = 20) String kids,
            @Size(max = 6) List<@NotBlank @Size(max = 30) String> languages,
            @Size(max = 5) List<@NotNull Long> interestIds,
            @Size(max = 3) List<@Valid PromptAnswer> prompts) {}

    /** Photo URLs in display order (first = main photo). Upload happens directly from the app to Cloudinary. */
    public record PhotosRequest(@NotNull @Size(min = 2, max = 6) List<@NotBlank @Size(max = 500) String> urls) {}

    public record LocationRequest(
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
            @Size(max = 80) String city,
            @Size(max = 60) String state) {}

    public record PreferencesRequest(
            @Min(18) @Max(80) int minAge,
            @Min(18) @Max(80) int maxAge,
            @Min(1) @Max(500) int maxDistanceKm,
            Set<Intent> intents) {}

    // ---------- Responses ----------

    public record PhotoDto(Long id, String url) {}

    public record PromptDto(Long id, Long promptId, String question, String answer) {}

    /** What other people see: used in Discover, Likes, Chat header and "view profile". */
    public record ProfileCard(
            Long id,
            String name,
            Integer age,
            String city,
            String state,
            Double distanceKm,
            Intent intent,
            boolean verified,
            List<PhotoDto> photos,
            String bio,
            List<PromptDto> prompts,
            Map<String, Object> details,
            List<String> interests,
            List<String> languages) {}

    public record PreferencesDto(int minAge, int maxAge, int maxDistanceKm, Set<Intent> intents) {}

    /** Everything about the logged-in user, for the My Profile and Edit Profile screens. */
    public record MeResponse(
            Long id,
            String phone,
            String email,
            LocalDate dob,
            Gender gender,
            InterestedIn interestedIn,
            boolean hasLocation,
            boolean onboardingComplete,
            List<Long> interestIds,
            PreferencesDto preferences,
            ProfileCard card) {}
}
