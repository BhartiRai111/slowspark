package com.slowspark.date;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** "Usme kya achha laga?" — one per user per date request. */
@Entity
@Table(name = "date_feedback")
@Getter
@Setter
@NoArgsConstructor
public class DateFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_request_id", nullable = false)
    private Long dateRequestId;

    @Column(name = "from_user", nullable = false)
    private Long fromUser;

    @Column(name = "to_user", nullable = false)
    private Long toUser;

    @Column(name = "liked_text", nullable = false)
    private String likedText;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public DateFeedback(Long dateRequestId, Long fromUser, Long toUser, String likedText) {
        this.dateRequestId = dateRequestId;
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.likedText = likedText;
    }
}
