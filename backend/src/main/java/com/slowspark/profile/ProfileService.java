package com.slowspark.profile;

import com.slowspark.common.ApiException;
import com.slowspark.common.GeoUtils;
import com.slowspark.meta.InterestRepository;
import com.slowspark.meta.Prompt;
import com.slowspark.meta.PromptRepository;
import com.slowspark.profile.ProfileDtos.*;
import com.slowspark.user.User;
import com.slowspark.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.*;

/**
 * Everything about creating and editing a profile, plus building the "ProfileCard"
 * that other users see.
 */
@Service
public class ProfileService {

    private final UserRepository users;
    private final UserProfileRepository profiles;
    private final UserPhotoRepository photos;
    private final UserPromptRepository userPrompts;
    private final UserPreferencesRepository preferences;
    private final InterestRepository interests;
    private final PromptRepository prompts;

    public ProfileService(UserRepository users, UserProfileRepository profiles, UserPhotoRepository photos,
                          UserPromptRepository userPrompts, UserPreferencesRepository preferences,
                          InterestRepository interests, PromptRepository prompts) {
        this.users = users;
        this.profiles = profiles;
        this.photos = photos;
        this.userPrompts = userPrompts;
        this.preferences = preferences;
        this.interests = interests;
        this.prompts = prompts;
    }

    public User getUser(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    // ---------- Onboarding / edit ----------

    @Transactional
    public void updateBasicInfo(Long userId, BasicInfoRequest req) {
        if (Period.between(req.dob(), LocalDate.now()).getYears() < 18) {
            throw ApiException.badRequest("SlowSpark sirf 18+ users ke liye hai");
        }
        User user = getUser(userId);
        user.setName(req.name().trim());
        user.setDob(req.dob());
        user.setGender(req.gender());
        user.setInterestedIn(req.interestedIn());
        if (req.city() != null) user.setCity(req.city());
        if (req.state() != null) user.setState(req.state());
        // Every user gets a profile row and default preferences as soon as basic info is saved.
        profiles.findById(userId).orElseGet(() -> profiles.save(new UserProfile(userId)));
        preferences.findById(userId).orElseGet(() -> preferences.save(new UserPreferences(userId)));
    }

    @Transactional
    public void updateIntent(Long userId, IntentRequest req) {
        getUser(userId).setIntent(req.intent());
    }

    @Transactional
    public void updateProfile(Long userId, ProfileUpdateRequest req) {
        UserProfile p = profiles.findById(userId).orElseGet(() -> profiles.save(new UserProfile(userId)));
        p.setBio(req.bio());
        p.setHeightCm(req.heightCm());
        p.setEducation(req.education());
        p.setCollege(req.college());
        p.setJobTitle(req.jobTitle());
        p.setCompany(req.company());
        p.setHometown(req.hometown());
        p.setReligion(req.religion());
        p.setZodiac(req.zodiac());
        p.setDrinking(req.drinking());
        p.setSmoking(req.smoking());
        p.setWorkout(req.workout());
        p.setDiet(req.diet());
        p.setPets(req.pets());
        p.setKids(req.kids());

        p.getLanguages().clear();
        if (req.languages() != null) p.getLanguages().addAll(req.languages());

        p.getInterests().clear();
        if (req.interestIds() != null && !req.interestIds().isEmpty()) {
            p.getInterests().addAll(interests.findAllById(req.interestIds()));
        }

        if (req.prompts() != null) {
            userPrompts.deleteAllForUser(userId);
            userPrompts.flush();
            Set<Long> seen = new HashSet<>();
            int position = 0;
            for (PromptAnswer pa : req.prompts()) {
                if (!seen.add(pa.promptId())) continue; // same question twice → keep the first
                Prompt prompt = prompts.findById(pa.promptId())
                        .orElseThrow(() -> ApiException.badRequest("Unknown prompt " + pa.promptId()));
                UserPrompt up = new UserPrompt();
                up.setUserId(userId);
                up.setPrompt(prompt);
                up.setAnswer(pa.answer().trim());
                up.setPosition(position++);
                userPrompts.save(up);
            }
        }
    }

    @Transactional
    public void updatePhotos(Long userId, PhotosRequest req) {
        photos.deleteAllForUser(userId);
        photos.flush();
        for (int i = 0; i < req.urls().size(); i++) {
            photos.save(new UserPhoto(userId, req.urls().get(i), i));
        }
    }

    @Transactional
    public void updateLocation(Long userId, LocationRequest req) {
        User user = getUser(userId);
        user.setLatitude(req.latitude());
        user.setLongitude(req.longitude());
        if (req.city() != null && !req.city().isBlank()) user.setCity(req.city());
        if (req.state() != null && !req.state().isBlank()) user.setState(req.state());
    }

    @Transactional
    public void updatePreferences(Long userId, PreferencesRequest req) {
        if (req.minAge() > req.maxAge()) {
            throw ApiException.badRequest("Min age max age se zyada nahi ho sakti");
        }
        UserPreferences prefs = preferences.findById(userId).orElseGet(() -> new UserPreferences(userId));
        prefs.setMinAge(req.minAge());
        prefs.setMaxAge(req.maxAge());
        prefs.setMaxDistanceKm(req.maxDistanceKm());
        prefs.getIntents().clear();
        if (req.intents() != null) prefs.getIntents().addAll(req.intents());
        preferences.save(prefs);
    }

    /** Called at the end of onboarding. Checks every required piece is there before showing the user in Discover. */
    @Transactional
    public void completeOnboarding(Long userId) {
        User user = getUser(userId);
        List<String> missing = new ArrayList<>();
        if (user.getName() == null || user.getDob() == null || user.getGender() == null || user.getInterestedIn() == null) {
            missing.add("basic info");
        }
        if (user.getIntent() == null) missing.add("intent");
        if (photos.countByUserId(userId) < 2) missing.add("kam se kam 2 photos");
        if (user.getLatitude() == null) missing.add("location");
        if (!missing.isEmpty()) {
            throw ApiException.badRequest("Profile adhoori hai: " + String.join(", ", missing));
        }
        user.setOnboardingComplete(true);
    }

    // ---------- Reading ----------

    @Transactional(readOnly = true)
    public MeResponse me(Long userId) {
        User user = getUser(userId);
        UserPreferences prefs = preferences.findById(userId).orElseGet(() -> new UserPreferences(userId));
        List<Long> interestIds = profiles.findById(userId)
                .map(p -> p.getInterests().stream().map(i -> i.getId()).toList())
                .orElse(List.of());
        return new MeResponse(user.getId(), user.getPhone(), user.getEmail(), user.getDob(), user.getGender(),
                user.getInterestedIn(), user.getLatitude() != null, user.isOnboardingComplete(), interestIds,
                new PreferencesDto(prefs.getMinAge(), prefs.getMaxAge(), prefs.getMaxDistanceKm(), prefs.getIntents()),
                card(user, null));
    }

    /** The profile as another user (viewer) sees it, with distance from the viewer. */
    @Transactional(readOnly = true)
    public ProfileCard card(Long userId, User viewer) {
        return card(getUser(userId), viewer);
    }

    @Transactional(readOnly = true)
    public ProfileCard card(User user, User viewer) {
        Long id = user.getId();
        UserProfile p = profiles.findById(id).orElseGet(() -> new UserProfile(id));

        List<PhotoDto> photoDtos = photos.findByUserIdOrderByPositionAsc(id).stream()
                .map(ph -> new PhotoDto(ph.getId(), ph.getUrl()))
                .toList();
        List<PromptDto> promptDtos = userPrompts.findByUserIdOrderByPositionAsc(id).stream()
                .map(up -> new PromptDto(up.getId(), up.getPrompt().getId(), up.getPrompt().getQuestion(), up.getAnswer()))
                .toList();

        Map<String, Object> details = new LinkedHashMap<>();
        putIfPresent(details, "heightCm", p.getHeightCm());
        putIfPresent(details, "jobTitle", p.getJobTitle());
        putIfPresent(details, "company", p.getCompany());
        putIfPresent(details, "education", p.getEducation());
        putIfPresent(details, "college", p.getCollege());
        putIfPresent(details, "hometown", p.getHometown());
        putIfPresent(details, "religion", p.getReligion());
        putIfPresent(details, "zodiac", p.getZodiac());
        putIfPresent(details, "drinking", p.getDrinking());
        putIfPresent(details, "smoking", p.getSmoking());
        putIfPresent(details, "workout", p.getWorkout());
        putIfPresent(details, "diet", p.getDiet());
        putIfPresent(details, "pets", p.getPets());
        putIfPresent(details, "kids", p.getKids());

        Double distance = viewer == null ? null
                : GeoUtils.distanceKm(viewer.getLatitude(), viewer.getLongitude(), user.getLatitude(), user.getLongitude());

        return new ProfileCard(id, user.getName(), user.getAge(), user.getCity(), user.getState(), distance,
                user.getIntent(), user.isVerified(), photoDtos, p.getBio(), promptDtos, details,
                p.getInterests().stream().map(i -> i.getName()).toList(),
                List.copyOf(p.getLanguages()));
    }

    private static void putIfPresent(Map<String, Object> map, String key, Object value) {
        if (value != null && !(value instanceof String s && s.isBlank())) {
            map.put(key, value);
        }
    }
}
