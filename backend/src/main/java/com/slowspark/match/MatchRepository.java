package com.slowspark.match;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchRepository extends JpaRepository<Match, Long> {

    Optional<Match> findByUser1IdAndUser2Id(Long user1Id, Long user2Id);

    @Query("""
            select m from Match m
            where (m.user1Id = :me or m.user2Id = :me) and m.status = com.slowspark.match.Match.Status.ACTIVE
            order by m.matchedAt desc
            """)
    List<Match> findActiveFor(@Param("me") Long me);
}
