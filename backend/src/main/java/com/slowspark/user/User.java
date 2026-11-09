package com.slowspark.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;

/** One row in the "users" table: login identity + basic info used for matching. */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "firebase_uid", nullable = false, unique = true)
    private String firebaseUid;

    private String phone;
    private String email;
    private String name;
    private LocalDate dob;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "interested_in")
    private InterestedIn interestedIn;

    @Enumerated(EnumType.STRING)
    private Intent intent;

    private String city;
    private String state;
    private Double latitude;
    private Double longitude;

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    @Column(name = "onboarding_complete", nullable = false)
    private boolean onboardingComplete;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "last_active")
    private Instant lastActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Integer getAge() {
        return dob == null ? null : Period.between(dob, LocalDate.now()).getYears();
    }
}
