package com.slowspark.match;

import com.slowspark.chat.Message;
import com.slowspark.chat.MessageRepository;
import com.slowspark.chat.RealtimeNotifier;
import com.slowspark.common.ApiException;
import com.slowspark.match.MatchDtos.*;
import com.slowspark.profile.ProfileDtos.ProfileCard;
import com.slowspark.profile.ProfileService;
import com.slowspark.safety.BlockRepository;
import com.slowspark.user.User;
import com.slowspark.user.UserStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Likes, passes, matches and unmatching. */
@Service
public class MatchService {

    private final SwipeRepository swipes;
    private final MatchRepository matches;
    private final MessageRepository messages;
    private final BlockRepository blocks;
    private final ProfileService profileService;
    private final RealtimeNotifier notifier;
    private final int dateMinDays;
    private final int dateMinMessages;

    public MatchService(SwipeRepository swipes, MatchRepository matches, MessageRepository messages,
                        BlockRepository blocks, ProfileService profileService, RealtimeNotifier notifier,
                        @Value("${app.date-ready.min-days-after-match}") int dateMinDays,
                        @Value("${app.date-ready.min-messages}") int dateMinMessages) {
        this.swipes = swipes;
        this.matches = matches;
        this.messages = messages;
        this.blocks = blocks;
        this.profileService = profileService;
        this.notifier = notifier;
        this.dateMinDays = dateMinDays;
        this.dateMinMessages = dateMinMessages;
    }

    // ---------- Swiping ----------

    @Transactional
    public SwipeResult like(Long me, Long targetId, String comment) {
        checkCanSwipe(me, targetId);
        swipes.save(new Swipe(me, targetId, Swipe.Action.LIKE, blankToNull(comment)));

        // If they already liked me → it's a match.
        if (swipes.existsByFromUserAndToUserAndAction(targetId, me, Swipe.Action.LIKE)) {
            Match match = matches.findByUser1IdAndUser2Id(Math.min(me, targetId), Math.max(me, targetId))
                    .orElseGet(() -> matches.save(new Match(me, targetId)));
            notifier.send(targetId, "NEW_MATCH", Map.of("matchId", match.getId(), "userId", me));
            return new SwipeResult(true, match.getId());
        }
        return new SwipeResult(false, null);
    }

    @Transactional
    public void pass(Long me, Long targetId) {
        checkCanSwipe(me, targetId);
        swipes.save(new Swipe(me, targetId, Swipe.Action.PASS, null));
    }

    private void checkCanSwipe(Long me, Long targetId) {
        if (me.equals(targetId)) {
            throw ApiException.badRequest("Apne aap ko like nahi kar sakte");
        }
        User target = profileService.getUser(targetId);
        if (target.getStatus() != UserStatus.ACTIVE || !target.isOnboardingComplete() || blocks.existsBetween(me, targetId)) {
            throw ApiException.notFound("Ye profile ab available nahi hai");
        }
        if (swipes.findByFromUserAndToUser(me, targetId).isPresent()) {
            throw ApiException.badRequest("Is profile pe pehle hi jawab de diya hai");
        }
    }

    /** The Likes tab: people who liked me that I haven't answered. */
    @Transactional(readOnly = true)
    public List<LikeReceived> likesReceived(Long me) {
        User viewer = profileService.getUser(me);
        return swipes.findPendingLikesFor(me).stream()
                .filter(s -> !blocks.existsBetween(me, s.getFromUser()))
                .map(s -> {
                    User liker = profileService.getUser(s.getFromUser());
                    return liker.getStatus() == UserStatus.ACTIVE
                            ? new LikeReceived(profileService.card(liker, viewer), s.getComment(), s.getCreatedAt())
                            : null;
                })
                .filter(l -> l != null)
                .toList();
    }

    // ---------- Matches ----------

    @Transactional(readOnly = true)
    public List<MatchSummary> myMatches(Long me) {
        return matches.findActiveFor(me).stream().map(m -> summary(m, me)).toList();
    }

    private MatchSummary summary(Match m, Long me) {
        Long otherId = m.otherUser(me);
        ProfileCard other = profileService.card(otherId, null);
        String photo = other.photos().isEmpty() ? null : other.photos().get(0).url();
        Optional<Message> last = messages.findTopByMatchIdOrderByIdDesc(m.getId());
        return new MatchSummary(
                m.getId(), otherId, other.name(), photo, m.getMatchedAt(),
                last.map(Message::getContent).orElse(null),
                last.map(Message::getSentAt).orElse(null),
                last.map(msg -> msg.getSenderId().equals(me)).orElse(false),
                messages.countByMatchIdAndSenderIdNotAndReadAtIsNull(m.getId(), me),
                isDateReadyUnlocked(m));
    }

    /** Throws unless the match exists, is active, and the user is part of it. */
    @Transactional(readOnly = true)
    public Match requireActiveMatch(Long matchId, Long me) {
        Match m = matches.findById(matchId).orElseThrow(() -> ApiException.notFound("Match not found"));
        if (!m.involves(me)) {
            throw ApiException.forbidden("Not your match");
        }
        if (m.getStatus() != Match.Status.ACTIVE) {
            throw ApiException.badRequest("Ye match ab active nahi hai");
        }
        return m;
    }

    @Transactional
    public void unmatch(Long matchId, Long me) {
        Match m = requireActiveMatch(matchId, me);
        endMatch(m);
        notifier.send(m.otherUser(me), "UNMATCHED", Map.of("matchId", m.getId()));
    }

    /** Used by unmatch and block. */
    @Transactional
    public void endMatchBetween(Long a, Long b) {
        matches.findByUser1IdAndUser2Id(Math.min(a, b), Math.max(a, b))
                .filter(m -> m.getStatus() == Match.Status.ACTIVE)
                .ifPresent(this::endMatch);
    }

    private void endMatch(Match m) {
        m.setStatus(Match.Status.UNMATCHED);
        m.setUnmatchedAt(Instant.now());
    }

    /** "Date pe chalein?" unlocks after N days of matching AND enough messages. */
    public boolean isDateReadyUnlocked(Match m) {
        boolean oldEnough = m.getMatchedAt().plus(Duration.ofDays(dateMinDays)).isBefore(Instant.now());
        return oldEnough && messages.countByMatchId(m.getId()) >= dateMinMessages;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
