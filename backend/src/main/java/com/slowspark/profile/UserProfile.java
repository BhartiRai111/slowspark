package com.slowspark.profile;

import com.slowspark.meta.Interest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * The "About me" part of a profile (one row per user in user_profile).
 * Languages and interests live in their own small tables but are loaded with the profile.
 */
@Entity
@Table(name = "user_profile")
@Getter
@Setter
@NoArgsConstructor
public class UserProfile {

    /** Same value as users.id */
    @Id
    @Column(name = "user_id")
    private Long userId;

    private String bio;

    @Column(name = "height_cm")
    private Integer heightCm;

    private String education;
    private String college;

    @Column(name = "job_title")
    private String jobTitle;

    private String company;
    private String hometown;
    private String religion;
    private String zodiac;
    private String drinking;
    private String smoking;
    private String workout;
    private String diet;
    private String pets;
    private String kids;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_languages", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "language")
    private Set<String> languages = new LinkedHashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_interests",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "interest_id"))
    private Set<Interest> interests = new LinkedHashSet<>();

    public UserProfile(Long userId) {
        this.userId = userId;
    }
}
