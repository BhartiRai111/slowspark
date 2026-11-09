package com.slowspark.safety;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

/** blocker_id has blocked blocked_id. Blocked users never see each other again. */
@Entity
@Table(name = "blocks")
@IdClass(Block.Key.class)
@Getter
@NoArgsConstructor
public class Block {

    @Id
    @Column(name = "blocker_id")
    private Long blockerId;

    @Id
    @Column(name = "blocked_id")
    private Long blockedId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Block(Long blockerId, Long blockedId) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
    }

    /** Composite primary key (blocker_id, blocked_id). */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class Key implements Serializable {
        private Long blockerId;
        private Long blockedId;
    }
}
