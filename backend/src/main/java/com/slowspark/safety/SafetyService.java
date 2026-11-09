package com.slowspark.safety;

import com.slowspark.auth.FirebaseTokenVerifier;
import com.slowspark.common.ApiException;
import com.slowspark.match.MatchService;
import com.slowspark.user.User;
import com.slowspark.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Block, report, and permanent account deletion (all required for Play Store dating apps). */
@Service
public class SafetyService {

    private final BlockRepository blocks;
    private final ReportRepository reports;
    private final UserRepository users;
    private final MatchService matchService;
    private final FirebaseTokenVerifier firebase;

    public SafetyService(BlockRepository blocks, ReportRepository reports, UserRepository users,
                         MatchService matchService, FirebaseTokenVerifier firebase) {
        this.blocks = blocks;
        this.reports = reports;
        this.users = users;
        this.matchService = matchService;
        this.firebase = firebase;
    }

    /** Blocking also ends any match, so chat disappears for both. */
    @Transactional
    public void block(Long me, Long other) {
        if (me.equals(other)) {
            throw ApiException.badRequest("Apne aap ko block nahi kar sakte");
        }
        if (!users.existsById(other)) {
            throw ApiException.notFound("User not found");
        }
        if (!blocks.existsById(new Block.Key(me, other))) {
            blocks.save(new Block(me, other));
        }
        matchService.endMatchBetween(me, other);
    }

    /** Reporting always blocks too, so the reporter never sees that person again. */
    @Transactional
    public void report(Long me, Long other, Report.Reason reason, String details) {
        block(me, other);
        Report r = new Report();
        r.setReporterId(me);
        r.setReportedId(other);
        r.setReason(reason);
        r.setDetails(details == null || details.isBlank() ? null : details.trim());
        reports.save(r);
    }

    /**
     * Deletes the user and ALL their data (photos, profile, chats, matches...) via ON DELETE CASCADE
     * in the database, and removes the Firebase login too.
     */
    @Transactional
    public void deleteAccount(Long me) {
        User user = users.findById(me).orElseThrow(() -> ApiException.notFound("User not found"));
        String uid = user.getFirebaseUid();
        users.deleteUserRow(me);
        firebase.deleteUser(uid);
    }
}
