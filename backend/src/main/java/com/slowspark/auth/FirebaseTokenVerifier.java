package com.slowspark.auth;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.slowspark.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Talks to Firebase. The mobile app logs in with Firebase (phone OTP or Google) and sends us
 * Firebase's ID token; this class checks that token is genuine.
 * If no service-account file is configured (e.g. local testing), Firebase login is disabled
 * and only dev-login works.
 */
@Component
public class FirebaseTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(FirebaseTokenVerifier.class);

    private final FirebaseAuth firebaseAuth;

    public FirebaseTokenVerifier(@Value("${app.firebase.credentials-path:}") String credentialsPath) throws IOException {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            log.warn("FIREBASE_CREDENTIALS not set — Firebase login is disabled");
            this.firebaseAuth = null;
            return;
        }
        try (InputStream in = new FileInputStream(credentialsPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(in))
                    .build();
            FirebaseApp app = FirebaseApp.getApps().isEmpty()
                    ? FirebaseApp.initializeApp(options)
                    : FirebaseApp.getInstance();
            this.firebaseAuth = FirebaseAuth.getInstance(app);
        }
    }

    public FirebaseToken verify(String idToken) {
        if (firebaseAuth == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Firebase login is not configured on the server");
        }
        try {
            return firebaseAuth.verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Login expired, please try again");
        }
    }

    /** Removes the user from Firebase too when they delete their account. Failures are only logged. */
    public void deleteUser(String uid) {
        if (firebaseAuth == null || uid.startsWith("dev-")) {
            return;
        }
        try {
            firebaseAuth.deleteUser(uid);
        } catch (FirebaseAuthException e) {
            log.warn("Could not delete Firebase user {}", uid, e);
        }
    }
}
