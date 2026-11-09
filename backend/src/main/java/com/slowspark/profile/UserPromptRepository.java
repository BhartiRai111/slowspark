package com.slowspark.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserPromptRepository extends JpaRepository<UserPrompt, Long> {

    List<UserPrompt> findByUserIdOrderByPositionAsc(Long userId);

    @Modifying
    @Query("delete from UserPrompt p where p.userId = :userId")
    void deleteAllForUser(@Param("userId") Long userId);
}
