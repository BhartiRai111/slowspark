package com.slowspark.match;

import com.slowspark.common.ApiException;
import com.slowspark.profile.ProfileDtos.ProfileCard;
import com.slowspark.profile.ProfileService;
import com.slowspark.profile.UserPreferences;
import com.slowspark.profile.UserPreferencesRepository;
import com.slowspark.user.Intent;
import com.slowspark.user.InterestedIn;
import com.slowspark.user.User;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Builds the Discover feed. Rules:
 * - only active users who finished onboarding
 * - gender / "interested in" must work both ways
 * - intent must be one the viewer wants (default: same intent as viewer)
 * - inside the viewer's age range and distance
 * - never someone already swiped on, or blocked either way
 * Order: people who already liked you first, then same intent, then recently active.
 */
@Service
public class DiscoverService {

    private static final int PAGE_SIZE = 20;

    private static final String DISCOVER_SQL = """
            SELECT u.* FROM users u
            WHERE u.id <> :me
              AND u.status = 'ACTIVE'
              AND u.onboarding_complete = TRUE
              AND u.gender IN (:genders)
              AND u.interested_in IN (:accepting)
              AND u.intent IN (:intents)
              AND u.dob BETWEEN :minDob AND :maxDob
              AND u.latitude IS NOT NULL
              AND (6371 * acos(least(1.0,
                    cos(radians(:lat)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(:lng))
                    + sin(radians(:lat)) * sin(radians(u.latitude))))) <= :maxKm
              AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.from_user = :me AND s.to_user = u.id)
              AND NOT EXISTS (SELECT 1 FROM blocks b
                              WHERE (b.blocker_id = :me AND b.blocked_id = u.id)
                                 OR (b.blocker_id = u.id AND b.blocked_id = :me))
            ORDER BY
              (EXISTS (SELECT 1 FROM swipes s2 WHERE s2.from_user = u.id AND s2.to_user = :me AND s2.action = 'LIKE')) DESC,
              (u.intent = :myIntent) DESC,
              u.last_active DESC NULLS LAST
            LIMIT :limit
            """;

    private final EntityManager em;
    private final ProfileService profileService;
    private final UserPreferencesRepository preferencesRepo;

    public DiscoverService(EntityManager em, ProfileService profileService, UserPreferencesRepository preferencesRepo) {
        this.em = em;
        this.profileService = profileService;
        this.preferencesRepo = preferencesRepo;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public List<ProfileCard> feed(Long meId) {
        User me = profileService.getUser(meId);
        if (!me.isOnboardingComplete()) {
            throw ApiException.badRequest("Pehle apni profile poori karo");
        }
        me.setLastActive(Instant.now());

        UserPreferences prefs = preferencesRepo.findById(meId).orElseGet(() -> new UserPreferences(meId));
        Set<Intent> intents = prefs.getIntents().isEmpty() ? Set.of(me.getIntent()) : prefs.getIntents();

        LocalDate today = LocalDate.now();
        LocalDate maxDob = today.minusYears(prefs.getMinAge());        // youngest allowed
        LocalDate minDob = today.minusYears(prefs.getMaxAge() + 1L).plusDays(1); // oldest allowed

        List<User> found = em.createNativeQuery(DISCOVER_SQL, User.class)
                .setParameter("me", meId)
                .setParameter("genders", me.getInterestedIn().genders())
                .setParameter("accepting", InterestedIn.acceptingGender(me.getGender()))
                .setParameter("intents", intents.stream().map(Enum::name).toList())
                .setParameter("minDob", minDob)
                .setParameter("maxDob", maxDob)
                .setParameter("lat", me.getLatitude())
                .setParameter("lng", me.getLongitude())
                .setParameter("maxKm", (double) prefs.getMaxDistanceKm())
                .setParameter("myIntent", me.getIntent().name())
                .setParameter("limit", PAGE_SIZE)
                .getResultList();

        return found.stream().map(u -> profileService.card(u, me)).toList();
    }
}
