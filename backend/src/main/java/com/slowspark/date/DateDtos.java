package com.slowspark.date;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class DateDtos {

    private DateDtos() {}

    /** What the Date Ready screens should show, from the current user's point of view. */
    public enum Stage {
        LOCKED,            // not unlocked yet (needs more days / messages)
        AVAILABLE,         // show "Date pe chalein?" button
        WAITING,           // I answered; waiting (the other person's choice is never shown)
        FORM,              // both said yes: fill "kya achha laga" + my questions
        ANSWER,            // the other person's questions are waiting for my answers
        WAITING_FOR_THEM,  // I'm done; they still have to fill or answer
        REVEALED           // everything is visible to both
    }

    public record ChoiceRequest(@NotNull DateRequest.Choice choice) {}

    public record FormRequest(
            @NotBlank @Size(max = 500) String likedText,
            @NotNull @Size(min = 1, max = 3) List<@NotBlank @Size(max = 200) String> questions) {}

    public record AnswerItem(@NotNull Long questionId, @Size(max = 500) String answer, boolean skip) {}

    public record AnswersRequest(@NotNull @Size(min = 1, max = 3) List<@Valid AnswerItem> answers) {}

    public record QuestionDto(Long id, String question, String answer, boolean skipped, boolean answered) {}

    /** Shown once both have finished. */
    public record Reveal(
            String theyLikedAboutMe,
            String iLikedAboutThem,
            List<QuestionDto> myQuestionsTheirAnswers,
            List<QuestionDto> theirQuestionsMyAnswers) {}

    public record DateReadyView(
            Long requestId,
            Stage stage,
            Instant expiresAt,
            List<QuestionDto> questionsForMe,
            Reveal reveal) {}
}
