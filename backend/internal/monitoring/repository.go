package monitoring

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ResultRepository struct {
	db *pgxpool.Pool
}

type MonitoringResult struct {
	ID            int64     `json:"id"`
	ApplicationID string    `json:"application_id"`
	Healthy       bool      `json:"healthy"`
	StatusCode    *int      `json:"status_code,omitempty"`
	LatencyMS     float64   `json:"latency_ms"`
	ErrorMessage  *string   `json:"error_message,omitempty"`
	CheckedAt     time.Time `json:"checked_at"`
}

func NewResultRepository(db *pgxpool.Pool) *ResultRepository {
	return &ResultRepository{db: db}
}

func (repo *ResultRepository) Save(
	ctx context.Context,
	applicationID string,
	result CheckResult,
) error {

	var statusCode *int
	if result.StatusCode != 0 {
		statusCode = &result.StatusCode
	}

	var errorMessage *string
	if result.Error != "" {
		errorMessage = &result.Error
	}

	_, err := repo.db.Exec(
		ctx,
		`
		INSERT INTO monitoring_results
			(application_id, healthy, status_code, latency_ms, error_message)
		VALUES
			($1, $2, $3, $4, $5)
		`,
		applicationID,
		result.Healthy,
		statusCode,
		float64(result.Latency.Microseconds())/1000,
		errorMessage,
	)

	if err != nil {
		return fmt.Errorf("save monitoring result: %w", err)
	}

	return nil
}

func (repo *ResultRepository) ListByApplication(
	ctx context.Context,
	applicationID string,
	limit int,
) ([]MonitoringResult, error) {

	rows, err := repo.db.Query(
		ctx,
		`
		SELECT
			id,
			application_id,
			healthy,
			status_code,
			latency_ms,
			error_message,
			checked_at
		FROM monitoring_results
		WHERE application_id = $1
		ORDER BY checked_at DESC
		LIMIT $2
		`,
		applicationID,
		limit,
	)
	if err != nil {
		return nil, fmt.Errorf("list monitoring results: %w", err)
	}
	defer rows.Close()

	var results []MonitoringResult

	for rows.Next() {
		var result MonitoringResult

		if err := rows.Scan(
			&result.ID,
			&result.ApplicationID,
			&result.Healthy,
			&result.StatusCode,
			&result.LatencyMS,
			&result.ErrorMessage,
			&result.CheckedAt,
		); err != nil {
			return nil, fmt.Errorf("scan monitoring result: %w", err)
		}

		results = append(results, result)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate monitoring results: %w", err)
	}

	return results, nil
}

func (repo *ResultRepository) GetUptime(
	ctx context.Context,
	applicationID string,
) (float64, error) {

	var uptime float64

	err := repo.db.QueryRow(
		ctx,
		`
		SELECT COALESCE(
			100.0 * AVG(
				CASE
					WHEN healthy THEN 1.0
					ELSE 0.0
				END
			),
			0
		)
		FROM monitoring_results
		WHERE application_id = $1
		`,
		applicationID,
	).Scan(&uptime)

	if err != nil {
		return 0, fmt.Errorf("calculate uptime: %w", err)
	}

	return uptime, nil
}

func (repo *ResultRepository) GetLatencyStats(
	ctx context.Context,
	applicationID string,
) (map[string]interface{}, error) {

	var (
		avgLatency       float64
		minLatency       float64
		maxLatency       float64
		totalChecks      int
		successfulChecks int
		failedChecks     int
	)

	err := repo.db.QueryRow(ctx, `
		SELECT
			COALESCE(AVG(latency_ms), 0),
			COALESCE(MIN(latency_ms), 0),
			COALESCE(MAX(latency_ms), 0),
			COUNT(*),
			COUNT(*) FILTER (WHERE healthy = true),
			COUNT(*) FILTER (WHERE healthy = false)
		FROM monitoring_results
		WHERE application_id = $1
	`,
		applicationID,
	).Scan(
		&avgLatency,
		&minLatency,
		&maxLatency,
		&totalChecks,
		&successfulChecks,
		&failedChecks,
	)

	if err != nil {
		return nil, fmt.Errorf("get latency stats: %w", err)
	}

	return map[string]interface{}{
		"application_id":     applicationID,
		"average_latency_ms": avgLatency,
		"minimum_latency_ms": minLatency,
		"maximum_latency_ms": maxLatency,
		"total_checks":       totalChecks,
		"successful_checks":  successfulChecks,
		"failed_checks":      failedChecks,
	}, nil
}
