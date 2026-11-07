package logs

import "time"

type Log struct {
	ID            int64     `json:"id"`
	ApplicationID string    `json:"application_id"`
	Level         string    `json:"level"`
	Service       *string   `json:"service,omitempty"`
	Message       string    `json:"message"`
	CreatedAt     time.Time `json:"created_at"`
}

type CreateLogRequest struct {
	Level   string  `json:"level"`
	Service *string `json:"service,omitempty"`
	Message string  `json:"message"`
}

type IngestLogRequest struct {
	ApplicationID string `json:"application_id"`
	CreateLogRequest
}
