package com.slowspark.meta;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Master list item, e.g. "Travel", "Cricket". Seeded in V2__seed_master_data.sql. */
@Entity
@Table(name = "interests")
@Getter
@NoArgsConstructor
public class Interest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
}
