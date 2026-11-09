package com.slowspark.meta;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Master list of prompt questions, e.g. "Mera perfect Sunday…". */
@Entity
@Table(name = "prompts")
@Getter
@NoArgsConstructor
public class Prompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String question;
}
