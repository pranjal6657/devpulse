package logs

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
	logEntry CreateLogRequest,
) error {
	_, err := repo.db.Exec(ctx, `
		INSERT INTO logs (
			application_id,
			level,
			service,
			message
		)
		VALUES ($1, $2, $3, $4)
	`,
		applicationID,
		logEntry.Level,
		logEntry.Service,
		logEntry.Message,
	)

	if err != nil {
		return fmt.Errorf("create log: %w", err)
	}

	return nil
}

func (repo *Repository) ListByApplication(
	ctx context.Context,
	applicationID string,
	level string,
	limit int,
	offset int,
) ([]Log, error) {

	rows, err := repo.db.Query(ctx, `
        SELECT id, application_id, level, service, message, created_at
        FROM logs
        WHERE application_id = $1
          AND ($2 = '' OR level = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
    `, applicationID, level, limit, offset)

	if err != nil {
		return nil, fmt.Errorf("list logs: %w", err)
	}
	defer rows.Close()

	var logs []Log

	for rows.Next() {
		var entry Log

		if err := rows.Scan(
			&entry.ID,
			&entry.ApplicationID,
			&entry.Level,
			&entry.Service,
			&entry.Message,
			&entry.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan log: %w", err)
		}

		logs = append(logs, entry)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate logs: %w", err)
	}

	return logs, nil
}
