package com.slowspark.date;

import com.slowspark.chat.RealtimeNotifier;
import com.slowspark.common.ApiException;
import com.slowspark.date.DateDtos.*;
import com.slowspark.date.DateRequest.Choice;
import com.slowspark.date.DateRequest.Status;
import com.slowspark.match.Match;
import com.slowspark.match.MatchService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * The "Date Ready" feature (SlowSpark's main idea):
 * 1. After N days of chatting, both see "Date pe chalein?". Each chooses YES/NO privately.
 * 2. Only if both say YES: each writes what they liked about the other + up to 3 questions.
 * 3. Each answers the other's questions (any question can be skipped).
 * 4. When everything is done, answers are revealed to both at the same time.
 * A NO is never shown to the other person — the round just times out quietly.
 */
@Service
public class DateReadyService {

    private static final List<Status> ACTIVE = List.of(Status.WAITING, Status.QUESTIONS, Status.REVEALED);

    private final DateRequestRepository requests;
    private final DateFeedbackRepository feedback;
    private final DateQuestionRepository questions;
    private final MatchService matchService;
    private final RealtimeNotifier notifier;
    private final Duration answerWindow;
    private final Duration requestExpiry;

    public DateReadyService(DateRequestRepository requests, DateFeedbackRepository feedback,
                            DateQuestionRepository questions, MatchService matchService, RealtimeNotifier notifier,
                            @Value("${app.date-ready.answer-window-hours}") long answerWindowHours,
                            @Value("${app.date-ready.request-expiry-days}") long requestExpiryDays) {
        this.requests = requests;
        this.feedback = feedback;
        this.questions = questions;
        this.matchService = matchService;
        this.notifier = notifier;
        this.answerWindow = Duration.ofHours(answerWindowHours);
        this.requestExpiry = Duration.ofDays(requestExpiryDays);
    }

    // ---------- Reading ----------

    @Transactional(readOnly = true)
    public DateReadyView view(Long matchId, Long me) {
        Match match = matchService.requireActiveMatch(matchId, me);
        Optional<DateRequest> current = requests.findFirstByMatchIdAndStatusInOrderByIdDesc(matchId, ACTIVE);
        if (current.isEmpty()) {
            Stage stage = matchService.isDateReadyUnlocked(match) ? Stage.AVAILABLE : Stage.LOCKED;
            return new DateReadyView(null, stage, null, List.of(), null);
        }
        return buildView(current.get(), match, me);
    }

    private DateReadyView buildView(DateRequest req, Match match, Long me) {
        Long other = match.otherUser(me);
        boolean isUser1 = match.isUser1(me);
        List<QuestionDto> forMe = questions.findByDateRequestIdAndToUserOrderByIdAsc(req.getId(), me)
                .stream().map(DateReadyService::toDto).toList();

        Stage stage;
        Reveal reveal = null;
        switch (req.getStatus()) {
            case WAITING -> stage = req.choiceOf(isUser1) == Choice.PENDING ? Stage.AVAILABLE : Stage.WAITING;
            case QUESTIONS -> {
                boolean iSubmitted = feedback.findByDateRequestIdAndFromUser(req.getId(), me).isPresent();
                boolean iHaveUnanswered = forMe.stream().anyMatch(q -> !q.answered());
                if (!iSubmitted) stage = Stage.FORM;
                else if (iHaveUnanswered) stage = Stage.ANSWER;
                else stage = Stage.WAITING_FOR_THEM;
            }
            case REVEALED -> {
                stage = Stage.REVEALED;
                reveal = buildReveal(req.getId(), me, other);
            }
            default -> stage = Stage.LOCKED;
        }
        // Before the reveal, I may see the questions (to answer them) but never any answers from the other side.
        return new DateReadyView(req.getId(), stage, req.getExpiresAt(), forMe, reveal);
    }

    private Reveal buildReveal(Long requestId, Long me, Long other) {
        String theyLiked = feedback.findByDateRequestIdAndFromUser(requestId, other).map(DateFeedback::getLikedText).orElse(null);
        String iLiked = feedback.findByDateRequestIdAndFromUser(requestId, me).map(DateFeedback::getLikedText).orElse(null);
        List<QuestionDto> mine = questions.findByDateRequestIdAndFromUserOrderByIdAsc(requestId, me)
                .stream().map(DateReadyService::toDto).toList();
        List<QuestionDto> theirs = questions.findByDateRequestIdAndToUserOrderByIdAsc(requestId, me)
                .stream().map(DateReadyService::toDto).toList();
        return new Reveal(theyLiked, iLiked, mine, theirs);
    }

    private static QuestionDto toDto(DateQuestion q) {
        return new QuestionDto(q.getId(), q.getQuestion(), q.getAnswer(), q.isSkipped(), q.isDone());
    }

    // ---------- Step 1: YES / NO ----------

    @Transactional
    public DateReadyView choose(Long matchId, Long me, Choice choice) {
        if (choice == Choice.PENDING) {
            throw ApiException.badRequest("YES ya NO choose karo");
        }
        Match match = matchService.requireActiveMatch(matchId, me);
        if (!matchService.isDateReadyUnlocked(match)) {
            throw ApiException.badRequest("Date Ready abhi unlock nahi hua hai");
        }
        DateRequest req = requests.findFirstByMatchIdAndStatusInOrderByIdDesc(matchId, ACTIVE)
                .filter(r -> r.getStatus() == Status.WAITING)
                .orElseGet(() -> {
                    if (requests.findFirstByMatchIdAndStatusInOrderByIdDesc(matchId, ACTIVE).isPresent()) {
                        throw ApiException.badRequest("Is match ka Date Ready pehle se chal raha hai");
                    }
                    return requests.save(new DateRequest(matchId, Instant.now().plus(requestExpiry)));
                });

        boolean isUser1 = match.isUser1(me);
        if (req.choiceOf(isUser1) != Choice.PENDING) {
            throw ApiException.badRequest("Tumne pehle hi jawab de diya hai");
        }
        req.setChoice(isUser1, choice);

        if (req.getUser1Choice() == Choice.YES && req.getUser2Choice() == Choice.YES) {
            req.setStatus(Status.QUESTIONS);
            req.setExpiresAt(Instant.now().plus(answerWindow));
            notifyBoth(match, req);
        }
        return buildView(req, match, me);
    }

    // ---------- Step 2: "kya achha laga" + questions ----------

    @Transactional
    public DateReadyView submitForm(Long matchId, Long me, FormRequest form) {
        Match match = matchService.requireActiveMatch(matchId, me);
        DateRequest req = requireStatus(matchId, Status.QUESTIONS);
        if (feedback.findByDateRequestIdAndFromUser(req.getId(), me).isPresent()) {
            throw ApiException.badRequest("Form pehle hi bhar diya hai");
        }
        Long other = match.otherUser(me);
        feedback.save(new DateFeedback(req.getId(), me, other, form.likedText().trim()));
        for (String q : form.questions()) {
            questions.save(new DateQuestion(req.getId(), me, other, q.trim()));
        }
        notifier.send(other, "DATE_UPDATE", Map.of("matchId", matchId));
        revealIfComplete(req, match);
        return buildView(req, match, me);
    }

    // ---------- Step 3: answer the other person's questions ----------

    @Transactional
    public DateReadyView answer(Long matchId, Long me, AnswersRequest body) {
        Match match = matchService.requireActiveMatch(matchId, me);
        DateRequest req = requireStatus(matchId, Status.QUESTIONS);
        Map<Long, DateQuestion> mine = new HashMap<>();
        for (DateQuestion q : questions.findByDateRequestIdAndToUserOrderByIdAsc(req.getId(), me)) {
            mine.put(q.getId(), q);
        }
        Instant now = Instant.now();
        for (AnswerItem item : body.answers()) {
            DateQuestion q = mine.get(item.questionId());
            if (q == null) {
                throw ApiException.badRequest("Ye sawaal tumhare liye nahi hai");
            }
            if (q.isDone()) {
                continue; // already answered — answers can't be changed
            }
            if (item.skip()) {
                q.setSkipped(true);
            } else {
                if (item.answer() == null || item.answer().isBlank()) {
                    throw ApiException.badRequest("Jawab likho ya skip karo");
                }
                q.setAnswer(item.answer().trim());
            }
            q.setAnsweredAt(now);
        }
        questions.flush();
        notifier.send(match.otherUser(me), "DATE_UPDATE", Map.of("matchId", matchId));
        revealIfComplete(req, match);
        return buildView(req, match, me);
    }

    /** Reveal only when both forms are in and every question is answered or skipped. */
    private void revealIfComplete(DateRequest req, Match match) {
        boolean bothForms = feedback.countByDateRequestId(req.getId()) == 2;
        boolean allAnswered = questions.countByDateRequestIdAndAnsweredAtIsNull(req.getId()) == 0;
        if (bothForms && allAnswered) {
            req.setStatus(Status.REVEALED);
            req.setRevealedAt(Instant.now());
            notifyBoth(match, req);
        }
    }

    private DateRequest requireStatus(Long matchId, Status status) {
        DateRequest req = requests.findFirstByMatchIdAndStatusInOrderByIdDesc(matchId, ACTIVE)
                .orElseThrow(() -> ApiException.badRequest("Koi Date Ready request nahi hai"));
        if (req.getStatus() != status) {
            throw ApiException.badRequest("Abhi ye step available nahi hai");
        }
        return req;
    }

    private void notifyBoth(Match match, DateRequest req) {
        Map<String, Object> data = Map.of("matchId", match.getId(), "status", req.getStatus().name());
        notifier.send(match.getUser1Id(), "DATE_UPDATE", data);
        notifier.send(match.getUser2Id(), "DATE_UPDATE", data);
    }

    // ---------- Cleanup ----------

    /** Every 15 minutes: rounds that ran out of time become EXPIRED, so a new one can start later. */
    @Scheduled(fixedDelay = 15 * 60 * 1000)
    @Transactional
    public void expireOldRequests() {
        for (DateRequest r : requests.findByStatusInAndExpiresAtBefore(List.of(Status.WAITING, Status.QUESTIONS), Instant.now())) {
            r.setStatus(Status.EXPIRED);
        }
    }
}
