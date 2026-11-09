package com.slowspark.match;

import com.slowspark.profile.ProfileDtos.ProfileCard;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class MatchDtos {

    private MatchDtos() {}

    /** Optional comment sent with a like ("Tumhari chai wali baat pasand aayi!"). */
    public record LikeRequest(@Size(max = 200) String comment) {}

    public record SwipeResult(boolean matched, Long matchId) {}

    /** Someone who liked me, shown in the Likes tab. */
    public record LikeReceived(ProfileCard profile, String comment, Instant likedAt) {}

    /** One row in the Chats list. */
    public record MatchSummary(
            Long matchId,
            Long userId,
            String name,
            String photoUrl,
            Instant matchedAt,
            String lastMessage,
            Instant lastMessageAt,
            boolean lastMessageMine,
            long unreadCount,
            boolean dateReadyUnlocked) {}
}
