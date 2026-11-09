package com.slowspark.date;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DateRequestRepository extends JpaRepository<DateRequest, Long> {

    /** Latest round for a match that is still going on or already revealed. */
    Optional<DateRequest> findFirstByMatchIdAndStatusInOrderByIdDesc(Long matchId, Collection<DateRequest.Status> statuses);

    List<DateRequest> findByStatusInAndExpiresAtBefore(Collection<DateRequest.Status> statuses, Instant now);
}
