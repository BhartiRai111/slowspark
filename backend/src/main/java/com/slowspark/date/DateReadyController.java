package com.slowspark.date;

import com.slowspark.date.DateDtos.*;
import com.slowspark.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/** APIs for the Date Ready feature, all under one match: /api/matches/{matchId}/date-ready */
@RestController
@RequestMapping("/api/matches/{matchId}/date-ready")
public class DateReadyController {

    private final DateReadyService service;

    public DateReadyController(DateReadyService service) {
        this.service = service;
    }

    /** Which screen to show (LOCKED, AVAILABLE, FORM, ANSWER, REVEALED ...). */
    @GetMapping
    public DateReadyView view(@PathVariable Long matchId) {
        return service.view(matchId, CurrentUser.id());
    }

    /** {"choice": "YES"} or {"choice": "NO"} */
    @PostMapping("/choice")
    public DateReadyView choose(@PathVariable Long matchId, @Valid @RequestBody ChoiceRequest req) {
        return service.choose(matchId, CurrentUser.id(), req.choice());
    }

    /** {"likedText": "...", "questions": ["...", "..."]} */
    @PostMapping("/form")
    public DateReadyView form(@PathVariable Long matchId, @Valid @RequestBody FormRequest req) {
        return service.submitForm(matchId, CurrentUser.id(), req);
    }

    /** {"answers": [{"questionId": 5, "answer": "...", "skip": false}]} */
    @PostMapping("/answers")
    public DateReadyView answers(@PathVariable Long matchId, @Valid @RequestBody AnswersRequest req) {
        return service.answer(matchId, CurrentUser.id(), req);
    }
}
