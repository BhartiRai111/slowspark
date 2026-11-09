package com.slowspark.date;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** "Uske baare mein kya jaanna hai?" — a question from one user to the other, plus the answer. */
@Entity
@Table(name = "date_questions")
@Getter
@Setter
@NoArgsConstructor
public class DateQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_request_id", nullable = false)
    private Long dateRequestId;

    @Column(name = "from_user", nullable = false)
    private Long fromUser;

    @Column(name = "to_user", nullable = false)
    private Long toUser;

    @Column(nullable = false)
    private String question;

    private String answer;

    @Column(name = "is_skipped", nullable = false)
    private boolean skipped;

    @Column(name = "answered_at")
    private Instant answeredAt;

    public DateQuestion(Long dateRequestId, Long fromUser, Long toUser, String question) {
        this.dateRequestId = dateRequestId;
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.question = question;
    }

    public boolean isDone() {
        return answeredAt != null;
    }
}
