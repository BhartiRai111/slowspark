package com.slowspark.profile;

import com.slowspark.meta.Prompt;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A user's answer to a Hinge-style prompt, e.g. "Mera perfect Sunday…" → "Chai aur purani film". */
@Entity
@Table(name = "user_prompts")
@Getter
@Setter
@NoArgsConstructor
public class UserPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "prompt_id")
    private Prompt prompt;

    @Column(nullable = false)
    private String answer;

    @Column(nullable = false)
    private int position;
}
