package com.slowspark.profile;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A profile photo. The image itself lives in cloud storage (Cloudinary); we only keep its URL. */
@Entity
@Table(name = "user_photos")
@Getter
@Setter
@NoArgsConstructor
public class UserPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private int position;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    public UserPhoto(Long userId, String url, int position) {
        this.userId = userId;
        this.url = url;
        this.position = position;
        this.primary = position == 0;
    }
}
