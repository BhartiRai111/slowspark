package com.slowspark.date;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One "Date pe chalein?" round for a match.
 *
 * Status flow:
 *   WAITING   → both users choose YES/NO privately (nobody sees the other's choice)
 *   QUESTIONS → both said YES; each fills "kya achha laga" + up to 3 questions, then answers the other's
 *   REVEALED  → everything answered; both see all answers together
 *   EXPIRED   → time ran out (or someone said NO and the round quietly timed out)
 */
@Entity
@Table(name = "date_requests")
@Getter
@Setter
@NoArgsConstructor
public class DateRequest {

    public enum Choice { PENDING, YES, NO }

    public enum Status { WAITING, QUESTIONS, REVEALED, EXPIRED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Enumerated(EnumType.STRING)
    @Column(name = "user1_choice", nullable = false)
    private Choice user1Choice = Choice.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "user2_choice", nullable = false)
    private Choice user2Choice = Choice.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.WAITING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revealed_at")
    private Instant revealedAt;

    public DateRequest(Long matchId, Instant expiresAt) {
        this.matchId = matchId;
        this.expiresAt = expiresAt;
    }

    public Choice choiceOf(boolean isUser1) {
        return isUser1 ? user1Choice : user2Choice;
    }

    public void setChoice(boolean isUser1, Choice choice) {
        if (isUser1) user1Choice = choice; else user2Choice = choice;
    }
}
