package com.slowspark.match;

import com.slowspark.common.ApiException;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Two users who liked each other. user1Id is always the smaller id,
 * so the same pair can never get two rows.
 */
@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
public class Match {

    public enum Status { ACTIVE, UNMATCHED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user1_id", nullable = false)
    private Long user1Id;

    @Column(name = "user2_id", nullable = false)
    private Long user2Id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "matched_at", nullable = false, updatable = false)
    private Instant matchedAt = Instant.now();

    @Column(name = "unmatched_at")
    private Instant unmatchedAt;

    public Match(Long a, Long b) {
        this.user1Id = Math.min(a, b);
        this.user2Id = Math.max(a, b);
    }

    public boolean involves(Long userId) {
        return user1Id.equals(userId) || user2Id.equals(userId);
    }

    public Long otherUser(Long me) {
        if (user1Id.equals(me)) return user2Id;
        if (user2Id.equals(me)) return user1Id;
        throw ApiException.forbidden("Not your match");
    }

    public boolean isUser1(Long me) {
        return user1Id.equals(me);
    }
}
