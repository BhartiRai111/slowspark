-- SlowSpark database schema (version 1)
-- Every table that belongs to a user uses ON DELETE CASCADE,
-- so deleting a user removes all of their data (needed for Play Store account deletion).

-- ========== Users & profile ==========
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    firebase_uid        VARCHAR(128) NOT NULL UNIQUE,
    phone               VARCHAR(20) UNIQUE,
    email               VARCHAR(255) UNIQUE,
    name                VARCHAR(60),
    dob                 DATE,
    gender              VARCHAR(20),
    interested_in       VARCHAR(20),
    intent              VARCHAR(30),
    city                VARCHAR(80),
    state               VARCHAR(60),
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_active         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_discover ON users (status, onboarding_complete, gender);

CREATE TABLE user_profile (
    user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio        VARCHAR(300),
    height_cm  INT,
    education  VARCHAR(30),
    college    VARCHAR(120),
    job_title  VARCHAR(80),
    company    VARCHAR(80),
    hometown   VARCHAR(80),
    religion   VARCHAR(30),
    zodiac     VARCHAR(20),
    drinking   VARCHAR(20),
    smoking    VARCHAR(20),
    workout    VARCHAR(20),
    diet       VARCHAR(20),
    pets       VARCHAR(20),
    kids       VARCHAR(20)
);

CREATE TABLE user_photos (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url        VARCHAR(500) NOT NULL,
    position   INT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_photos_user ON user_photos (user_id, position);

CREATE TABLE interests (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE user_interests (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_id BIGINT NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE user_languages (
    user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(30) NOT NULL,
    PRIMARY KEY (user_id, language)
);

CREATE TABLE prompts (
    id       BIGSERIAL PRIMARY KEY,
    question VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE user_prompts (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id BIGINT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    answer    VARCHAR(250) NOT NULL,
    position  INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, prompt_id)
);

CREATE TABLE user_preferences (
    user_id         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    min_age         INT NOT NULL DEFAULT 18,
    max_age         INT NOT NULL DEFAULT 45,
    max_distance_km INT NOT NULL DEFAULT 50
);

CREATE TABLE user_preferred_intents (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    intent  VARCHAR(30) NOT NULL,
    PRIMARY KEY (user_id, intent)
);

-- ========== Swipe, match, chat ==========
CREATE TABLE swipes (
    id         BIGSERIAL PRIMARY KEY,
    from_user  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     VARCHAR(10) NOT NULL,
    comment    VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (from_user, to_user)
);
CREATE INDEX idx_swipes_to_user ON swipes (to_user, action);

-- user1_id is always the smaller id, so a pair can only have one row.
CREATE TABLE matches (
    id           BIGSERIAL PRIMARY KEY,
    user1_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    matched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unmatched_at TIMESTAMPTZ,
    UNIQUE (user1_id, user2_id),
    CHECK (user1_id < user2_id)
);

CREATE TABLE messages (
    id        BIGSERIAL PRIMARY KEY,
    match_id  BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content   VARCHAR(2000) NOT NULL,
    sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at   TIMESTAMPTZ
);
CREATE INDEX idx_messages_match ON messages (match_id, sent_at DESC);

-- ========== Date Ready feature ==========
CREATE TABLE date_requests (
    id           BIGSERIAL PRIMARY KEY,
    match_id     BIGINT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user1_choice VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    user2_choice VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    status       VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ NOT NULL,
    revealed_at  TIMESTAMPTZ
);
CREATE INDEX idx_date_requests_match ON date_requests (match_id, status);

CREATE TABLE date_feedback (
    id              BIGSERIAL PRIMARY KEY,
    date_request_id BIGINT NOT NULL REFERENCES date_requests(id) ON DELETE CASCADE,
    from_user       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_text      VARCHAR(500) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (date_request_id, from_user)
);

CREATE TABLE date_questions (
    id              BIGSERIAL PRIMARY KEY,
    date_request_id BIGINT NOT NULL REFERENCES date_requests(id) ON DELETE CASCADE,
    from_user       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question        VARCHAR(200) NOT NULL,
    answer          VARCHAR(500),
    is_skipped      BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at     TIMESTAMPTZ
);
CREATE INDEX idx_date_questions_request ON date_questions (date_request_id);

-- ========== Safety ==========
CREATE TABLE blocks (
    blocker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE reports (
    id          BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      VARCHAR(30) NOT NULL,
    details     VARCHAR(1000),
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
