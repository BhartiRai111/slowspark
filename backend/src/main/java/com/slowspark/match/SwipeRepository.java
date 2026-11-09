package com.slowspark.match;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SwipeRepository extends JpaRepository<Swipe, Long> {

    Optional<Swipe> findByFromUserAndToUser(Long fromUser, Long toUser);

    boolean existsByFromUserAndToUserAndAction(Long fromUser, Long toUser, Swipe.Action action);

    @Query("""
            select s from Swipe s
            where s.toUser = :me and s.action = :action
              and not exists (select 1 from Swipe mine where mine.fromUser = :me and mine.toUser = s.fromUser)
            order by s.createdAt desc
            """)
    List<Swipe> findIncomingUnanswered(@Param("me") Long me, @Param("action") Swipe.Action action);

    /** People who liked me and I haven't answered yet (the "Likes" tab). */
    default List<Swipe> findPendingLikesFor(Long me) {
        return findIncomingUnanswered(me, Swipe.Action.LIKE);
    }
}
