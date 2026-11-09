package com.slowspark.match;

import com.slowspark.match.MatchDtos.*;
import com.slowspark.profile.ProfileDtos.ProfileCard;
import com.slowspark.profile.ProfileService;
import com.slowspark.security.CurrentUser;
import com.slowspark.common.ApiException;
import com.slowspark.safety.BlockRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Discover feed, like/pass, Likes tab, matches list, unmatch, and viewing a profile. */
@RestController
@RequestMapping("/api")
public class MatchController {

    private final DiscoverService discoverService;
    private final MatchService matchService;
    private final ProfileService profileService;
    private final BlockRepository blocks;

    public MatchController(DiscoverService discoverService, MatchService matchService,
                           ProfileService profileService, BlockRepository blocks) {
        this.discoverService = discoverService;
        this.matchService = matchService;
        this.profileService = profileService;
        this.blocks = blocks;
    }

    @GetMapping("/discover")
    public List<ProfileCard> discover() {
        return discoverService.feed(CurrentUser.id());
    }

    @PostMapping("/users/{userId}/like")
    public SwipeResult like(@PathVariable Long userId, @Valid @RequestBody(required = false) LikeRequest req) {
        return matchService.like(CurrentUser.id(), userId, req == null ? null : req.comment());
    }

    @PostMapping("/users/{userId}/pass")
    public ResponseEntity<Void> pass(@PathVariable Long userId) {
        matchService.pass(CurrentUser.id(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}")
    public ProfileCard viewProfile(@PathVariable Long userId) {
        Long me = CurrentUser.id();
        if (blocks.existsBetween(me, userId)) {
            throw ApiException.notFound("Ye profile available nahi hai");
        }
        return profileService.card(userId, profileService.getUser(me));
    }

    @GetMapping("/likes")
    public List<LikeReceived> likes() {
        return matchService.likesReceived(CurrentUser.id());
    }

    @GetMapping("/matches")
    public List<MatchSummary> matches() {
        return matchService.myMatches(CurrentUser.id());
    }

    @PostMapping("/matches/{matchId}/unmatch")
    public ResponseEntity<Void> unmatch(@PathVariable Long matchId) {
        matchService.unmatch(matchId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
