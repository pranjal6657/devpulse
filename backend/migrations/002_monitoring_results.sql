CREATE TABLE monitoring_results (
    id BIGSERIAL PRIMARY KEY,

    application_id UUID NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

    healthy BOOLEAN NOT NULL,
    status_code INTEGER,
    latency_ms DOUBLE PRECISION,
    error_message TEXT,

    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitoring_results_application_time
    ON monitoring_results(application_id, checked_at DESC);