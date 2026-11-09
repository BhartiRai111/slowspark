package com.slowspark.match;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SwipeRepository extends JpaRepository<Swipe, Long> {

    Optional<Swipe> findByFromUserAndToUser(Long fromUser, Long toUser);

    boolean existsByFromUserAndToUserAndAction(Long fromUser, Long toUser, Swipe.Action action);

    /** People who liked me and I haven't answered yet (the "Likes" tab). */
    @Query("""
            select s from Swipe s
            where s.toUser = :me and s.action = com.slowspark.match.Swipe.Action.LIKE
              and not exists (select 1 from Swipe mine where mine.fromUser = :me and mine.toUser = s.fromUser)
            order by s.createdAt desc
            """)
    List<Swipe> findPendingLikesFor(@Param("me") Long me);
}
