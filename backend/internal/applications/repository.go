package applications

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/pranjal6657/devpulse/internal/monitoring"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (repo *Repository) Create(
	ctx context.Context,
	req CreateApplicationRequest,
) (*Application, error) {

	app := &Application{}

	err := repo.db.QueryRow(
		ctx,
		`
		INSERT INTO applications
			(name, description, endpoint)
		VALUES
			($1, $2, $3)
		RETURNING
			id, name, description, endpoint,
			status, created_at, updated_at
		`,
		req.Name,
		req.Description,
		req.Endpoint,
	).Scan(
		&app.ID,
		&app.Name,
		&app.Description,
		&app.Endpoint,
		&app.Status,
		&app.CreatedAt,
		&app.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("create application: %w", err)
	}

	return app, nil
}

func (repo *Repository) List(
	ctx context.Context,
) ([]Application, error) {

	rows, err := repo.db.Query(
		ctx,
		`
		SELECT
			id, name, description, endpoint,
			status, created_at, updated_at
		FROM applications
		ORDER BY created_at DESC
		`,
	)
	if err != nil {
		return nil, fmt.Errorf("list applications: %w", err)
	}
	defer rows.Close()

	var applications []Application

	for rows.Next() {
		var app Application

		if err := rows.Scan(
			&app.ID,
			&app.Name,
			&app.Description,
			&app.Endpoint,
			&app.Status,
			&app.CreatedAt,
			&app.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan application: %w", err)
		}

		applications = append(applications, app)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate applications: %w", err)
	}

	return applications, nil
}

func (repo *Repository) GetByID(
	ctx context.Context,
	id string,
) (*Application, error) {

	app := &Application{}

	err := repo.db.QueryRow(
		ctx,
		`
		SELECT
			id, name, description, endpoint,
			status, created_at, updated_at
		FROM applications
		WHERE id = $1
		`,
		id,
	).Scan(
		&app.ID,
		&app.Name,
		&app.Description,
		&app.Endpoint,
		&app.Status,
		&app.CreatedAt,
		&app.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("get application: %w", err)
	}

	return app, nil
}

func (repo *Repository) ListEndpoints(
	ctx context.Context,
) ([]monitoring.MonitoredApplication, error) {

	rows, err := repo.db.Query(
		ctx,
		`
		SELECT id, name, endpoint
		FROM applications
		ORDER BY created_at
		`,
	)
	if err != nil {
		return nil, fmt.Errorf("list monitored applications: %w", err)
	}
	defer rows.Close()

	var applications []monitoring.MonitoredApplication

	for rows.Next() {
		var app monitoring.MonitoredApplication

		if err := rows.Scan(
			&app.ID,
			&app.Name,
			&app.Endpoint,
		); err != nil {
			return nil, fmt.Errorf("scan monitored application: %w", err)
		}

		applications = append(applications, app)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate monitored applications: %w", err)
	}

	return applications, nil
}

func (repo *Repository) UpdateStatus(
	ctx context.Context,
	id string,
	status string,
) error {
	_, err := repo.db.Exec(
		ctx,
		`
		UPDATE applications
		SET status = $1,
		    updated_at = NOW()
		WHERE id = $2
		`,
		status,
		id,
	)

	if err != nil {
		return fmt.Errorf("update application status: %w", err)
	}

	return nil
}
