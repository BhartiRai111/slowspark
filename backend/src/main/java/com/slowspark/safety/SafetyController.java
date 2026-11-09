package com.slowspark.safety;

import com.slowspark.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SafetyController {

    public record ReportRequest(@NotNull Report.Reason reason, @Size(max = 1000) String details) {}

    private final SafetyService safetyService;

    public SafetyController(SafetyService safetyService) {
        this.safetyService = safetyService;
    }

    @PostMapping("/users/{userId}/block")
    public ResponseEntity<Void> block(@PathVariable Long userId) {
        safetyService.block(CurrentUser.id(), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/report")
    public ResponseEntity<Void> report(@PathVariable Long userId, @Valid @RequestBody ReportRequest req) {
        safetyService.report(CurrentUser.id(), userId, req.reason(), req.details());
        return ResponseEntity.noContent().build();
    }

    /** Settings → Delete account. Permanent. */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount() {
        safetyService.deleteAccount(CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
