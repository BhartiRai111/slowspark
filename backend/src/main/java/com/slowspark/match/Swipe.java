package com.slowspark.match;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One like or pass. A user can swipe on a given person only once (unique from_user + to_user). */
@Entity
@Table(name = "swipes")
@Getter
@Setter
@NoArgsConstructor
public class Swipe {

    public enum Action { LIKE, PASS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_user", nullable = false)
    private Long fromUser;

    @Column(name = "to_user", nullable = false)
    private Long toUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Action action;

    /** Optional Hinge-style comment sent with a like, e.g. on a photo or prompt. */
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Swipe(Long fromUser, Long toUser, Action action, String comment) {
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.action = action;
        this.comment = comment;
    }
}
