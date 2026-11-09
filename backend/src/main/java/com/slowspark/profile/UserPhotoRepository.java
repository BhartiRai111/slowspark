package com.slowspark.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserPhotoRepository extends JpaRepository<UserPhoto, Long> {

    List<UserPhoto> findByUserIdOrderByPositionAsc(Long userId);

    long countByUserId(Long userId);

    @Modifying
    @Query("delete from UserPhoto p where p.userId = :userId")
    void deleteAllForUser(@Param("userId") Long userId);
}
