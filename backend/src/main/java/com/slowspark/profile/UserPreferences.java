package com.slowspark.profile;

import com.slowspark.user.Intent;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

/** Discover filters: age range, distance, and which intents the user wants to see. */
@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
public class UserPreferences {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "min_age", nullable = false)
    private int minAge = 18;

    @Column(name = "max_age", nullable = false)
    private int maxAge = 45;

    @Column(name = "max_distance_km", nullable = false)
    private int maxDistanceKm = 50;

    /** Empty = "same intent as me". */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_preferred_intents", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "intent")
    @Enumerated(EnumType.STRING)
    private Set<Intent> intents = new LinkedHashSet<>();

    public UserPreferences(Long userId) {
        this.userId = userId;
    }
}
