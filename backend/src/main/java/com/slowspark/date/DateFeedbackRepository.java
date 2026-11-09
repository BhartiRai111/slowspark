package com.slowspark.date;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DateFeedbackRepository extends JpaRepository<DateFeedback, Long> {

    Optional<DateFeedback> findByDateRequestIdAndFromUser(Long dateRequestId, Long fromUser);

    long countByDateRequestId(Long dateRequestId);
}
