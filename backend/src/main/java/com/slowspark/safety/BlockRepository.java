package com.slowspark.safety;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlockRepository extends JpaRepository<Block, Block.Key> {

    @Query("""
            select count(b) from Block b
            where (b.blockerId = :a and b.blockedId = :b) or (b.blockerId = :b and b.blockedId = :a)
            """)
    long countBetween(@Param("a") Long a, @Param("b") Long b);

    /** True if either user has blocked the other. */
    default boolean existsBetween(Long a, Long b) {
        return countBetween(a, b) > 0;
    }
}
