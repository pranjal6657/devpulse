package incidents

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (repo *Repository) Create(
	ctx context.Context,
	applicationID string,
	title string,
) (string, error) {
	var incidentID string

	err := repo.db.QueryRow(ctx, `
		INSERT INTO incidents (
			application_id,
			title,
			status
		)
		VALUES ($1, $2, 'OPEN')
		RETURNING id
	`,
		applicationID,
		title,
	).Scan(&incidentID)

	if err != nil {
		return "", fmt.Errorf("create incident: %w", err)
	}

	return incidentID, nil
}

func (repo *Repository) HasOpenIncident(
	ctx context.Context,
	applicationID string,
	title string,
) (bool, error) {
	var exists bool

	err := repo.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM incidents
			WHERE application_id = $1
			  AND title = $2
			  AND status = 'OPEN'
		)
	`,
		applicationID,
		title,
	).Scan(&exists)

	if err != nil {
		return false, fmt.Errorf("check open incident: %w", err)
	}

	return exists, nil
}

func (repo *Repository) List(ctx context.Context) ([]Incident, error) {
	rows, err := repo.db.Query(ctx, `
		SELECT
			id,
			application_id,
			title,
			status,
			started_at,
			resolved_at
		FROM incidents
		ORDER BY started_at DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("list incidents: %w", err)
	}
	defer rows.Close()

	var result []Incident

	for rows.Next() {
		var incident Incident

		if err := rows.Scan(
			&incident.ID,
			&incident.ApplicationID,
			&incident.Title,
			&incident.Status,
			&incident.StartedAt,
			&incident.ResolvedAt,
		); err != nil {
			return nil, fmt.Errorf("scan incident: %w", err)
		}

		result = append(result, incident)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate incidents: %w", err)
	}

	return result, nil
}

func (repo *Repository) ListByApplication(
	ctx context.Context,
	applicationID string,
) ([]Incident, error) {
	rows, err := repo.db.Query(ctx, `
		SELECT
			id,
			application_id,
			title,
			status,
			started_at,
			resolved_at
		FROM incidents
		WHERE application_id = $1
		ORDER BY started_at DESC
	`, applicationID)

	if err != nil {
		return nil, fmt.Errorf("list application incidents: %w", err)
	}
	defer rows.Close()

	var result []Incident

	for rows.Next() {
		var incident Incident

		if err := rows.Scan(
			&incident.ID,
			&incident.ApplicationID,
			&incident.Title,
			&incident.Status,
			&incident.StartedAt,
			&incident.ResolvedAt,
		); err != nil {
			return nil, fmt.Errorf("scan incident: %w", err)
		}

		result = append(result, incident)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate incidents: %w", err)
	}

	return result, nil
}

func (repo *Repository) AddEvent(
	ctx context.Context,
	incidentID string,
	eventType string,
	message string,
) error {
	_, err := repo.db.Exec(ctx, `
		INSERT INTO incident_events (
			incident_id,
			event_type,
			message
		)
		VALUES ($1, $2, $3)
	`,
		incidentID,
		eventType,
		message,
	)

	if err != nil {
		return fmt.Errorf("add incident event: %w", err)
	}

	return nil
}

func (repo *Repository) ListEvents(
	ctx context.Context,
	incidentID string,
) ([]IncidentEvent, error) {
	rows, err := repo.db.Query(ctx, `
		SELECT
			id,
			incident_id,
			event_type,
			message,
			created_at
		FROM incident_events
		WHERE incident_id = $1
		ORDER BY created_at ASC
	`, incidentID)

	if err != nil {
		return nil, fmt.Errorf("list incident events: %w", err)
	}
	defer rows.Close()

	var result []IncidentEvent

	for rows.Next() {
		var event IncidentEvent

		if err := rows.Scan(
			&event.ID,
			&event.IncidentID,
			&event.EventType,
			&event.Message,
			&event.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan incident event: %w", err)
		}

		result = append(result, event)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate incident events: %w", err)
	}

	return result, nil
}

func (repo *Repository) ResolveOpenIncident(
	ctx context.Context,
	applicationID string,
	title string,
) error {
	var incidentID string

	err := repo.db.QueryRow(ctx, `
		UPDATE incidents
		SET status = 'RESOLVED',
		    resolved_at = NOW()
		WHERE application_id = $1
		  AND title = $2
		  AND status = 'OPEN'
		RETURNING id
	`,
		applicationID,
		title,
	).Scan(&incidentID)

	if err != nil {
		// No open incident is not an error.
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}

		return fmt.Errorf("resolve incident: %w", err)
	}

	return repo.AddEvent(
		ctx,
		incidentID,
		"INCIDENT_RESOLVED",
		"Application recovered and health checks are passing.",
	)
}

type IncidentStats struct {
	Total         int     `json:"total"`
	Open          int     `json:"open"`
	Resolved      int     `json:"resolved"`
	AvgDurationMS float64 `json:"average_duration_ms"`
}

func (repo *Repository) GetStats(
	ctx context.Context,
) (IncidentStats, error) {
	var stats IncidentStats

	err := repo.db.QueryRow(ctx, `
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'OPEN'),
			COUNT(*) FILTER (WHERE status = 'RESOLVED'),
			COALESCE(
				AVG(
					EXTRACT(EPOCH FROM (resolved_at - started_at)) * 1000
				) FILTER (WHERE status = 'RESOLVED'),
				0
			)
		FROM incidents
	`).Scan(
		&stats.Total,
		&stats.Open,
		&stats.Resolved,
		&stats.AvgDurationMS,
	)

	if err != nil {
		return IncidentStats{}, fmt.Errorf(
			"get incident stats: %w",
			err,
		)
	}

	return stats, nil
}
