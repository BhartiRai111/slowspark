package com.slowspark.safety;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlockRepository extends JpaRepository<Block, Block.Key> {

    /** True if either user has blocked the other. */
    @Query("""
            select count(b) > 0 from Block b
            where (b.blockerId = :a and b.blockedId = :b) or (b.blockerId = :b and b.blockedId = :a)
            """)
    boolean existsBetween(@Param("a") Long a, @Param("b") Long b);
}
