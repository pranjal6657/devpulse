package alerts

import (
	"context"
	"fmt"

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
	description string,
	severity string,
) error {
	_, err := repo.db.Exec(ctx, `
		INSERT INTO alerts (
			application_id,
			title,
			description,
			severity,
			status
		)
		VALUES ($1, $2, $3, $4, 'ACTIVE')
	`,
		applicationID,
		title,
		description,
		severity,
	)

	if err != nil {
		return fmt.Errorf("create alert: %w", err)
	}

	return nil
}

func (repo *Repository) HasActiveAlert(
	ctx context.Context,
	applicationID string,
	title string,
) (bool, error) {
	var exists bool

	err := repo.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM alerts
			WHERE application_id = $1
			  AND title = $2
			  AND status = 'ACTIVE'
		)
	`,
		applicationID,
		title,
	).Scan(&exists)

	if err != nil {
		return false, fmt.Errorf("check active alert: %w", err)
	}

	return exists, nil
}
func (repo *Repository) ResolveActiveAlert(
	ctx context.Context,
	applicationID string,
	title string,
) error {
	_, err := repo.db.Exec(ctx, `
		UPDATE alerts
		SET status = 'RESOLVED',
		    resolved_at = NOW()
		WHERE application_id = $1
		  AND title = $2
		  AND status = 'ACTIVE'
	`,
		applicationID,
		title,
	)

	if err != nil {
		return fmt.Errorf("resolve alert: %w", err)
	}

	return nil
}

func (repo *Repository) List(
	ctx context.Context,
) ([]Alert, error) {

	rows, err := repo.db.Query(ctx, `
		SELECT
			id,
			application_id,
			title,
			description,
			severity,
			status,
			created_at,
			resolved_at
		FROM alerts
		ORDER BY created_at DESC
	`)

	if err != nil {
		return nil, fmt.Errorf("list alerts: %w", err)
	}
	defer rows.Close()

	var result []Alert

	for rows.Next() {
		var alert Alert

		err := rows.Scan(
			&alert.ID,
			&alert.ApplicationID,
			&alert.Title,
			&alert.Description,
			&alert.Severity,
			&alert.Status,
			&alert.CreatedAt,
			&alert.ResolvedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("scan alert: %w", err)
		}

		result = append(result, alert)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate alerts: %w", err)
	}

	return result, nil
}

func (repo *Repository) ListByApplication(
	ctx context.Context,
	applicationID string,
) ([]Alert, error) {

	rows, err := repo.db.Query(ctx, `
		SELECT
			id,
			application_id,
			title,
			description,
			severity,
			status,
			created_at,
			resolved_at
		FROM alerts
		WHERE application_id = $1
		ORDER BY created_at DESC
	`, applicationID)

	if err != nil {
		return nil, fmt.Errorf("list application alerts: %w", err)
	}
	defer rows.Close()

	var result []Alert

	for rows.Next() {
		var alert Alert

		err := rows.Scan(
			&alert.ID,
			&alert.ApplicationID,
			&alert.Title,
			&alert.Description,
			&alert.Severity,
			&alert.Status,
			&alert.CreatedAt,
			&alert.ResolvedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("scan alert: %w", err)
		}

		result = append(result, alert)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate alerts: %w", err)
	}

	return result, nil
}

func (repo *Repository) ListFiltered(
	ctx context.Context,
	status string,
	severity string,
) ([]Alert, error) {

	rows, err := repo.db.Query(ctx, `
		SELECT
			id,
			application_id,
			title,
			description,
			severity,
			status,
			created_at,
			resolved_at
		FROM alerts
		WHERE ($1 = '' OR status = $1)
		  AND ($2 = '' OR severity = $2)
		ORDER BY created_at DESC
	`, status, severity)

	if err != nil {
		return nil, fmt.Errorf("list filtered alerts: %w", err)
	}
	defer rows.Close()

	var result []Alert

	for rows.Next() {
		var alert Alert

		err := rows.Scan(
			&alert.ID,
			&alert.ApplicationID,
			&alert.Title,
			&alert.Description,
			&alert.Severity,
			&alert.Status,
			&alert.CreatedAt,
			&alert.ResolvedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("scan alert: %w", err)
		}

		result = append(result, alert)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate alerts: %w", err)
	}

	return result, nil
}
