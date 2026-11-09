package com.slowspark.date;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DateQuestionRepository extends JpaRepository<DateQuestion, Long> {

    List<DateQuestion> findByDateRequestIdAndToUserOrderByIdAsc(Long dateRequestId, Long toUser);

    List<DateQuestion> findByDateRequestIdAndFromUserOrderByIdAsc(Long dateRequestId, Long fromUser);

    long countByDateRequestIdAndAnsweredAtIsNull(Long dateRequestId);
}
