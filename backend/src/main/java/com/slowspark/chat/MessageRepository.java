package com.slowspark.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Newest messages first; the app reverses them for display. */
    List<Message> findByMatchIdOrderByIdDesc(Long matchId, Pageable pageable);

    /** Older page: messages before a given message id. */
    List<Message> findByMatchIdAndIdLessThanOrderByIdDesc(Long matchId, Long beforeId, Pageable pageable);

    Optional<Message> findTopByMatchIdOrderByIdDesc(Long matchId);

    long countByMatchId(Long matchId);

    long countByMatchIdAndSenderIdNotAndReadAtIsNull(Long matchId, Long senderId);

    @Modifying
    @Query("update Message m set m.readAt = :now where m.matchId = :matchId and m.senderId <> :me and m.readAt is null")
    int markRead(@Param("matchId") Long matchId, @Param("me") Long me, @Param("now") Instant now);
}
