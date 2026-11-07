package alerts

import "time"

type Alert struct {
	ID            string     `json:"id"`
	ApplicationID string     `json:"application_id"`
	Title         string     `json:"title"`
	Description   *string    `json:"description,omitempty"`
	Severity      string     `json:"severity"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"created_at"`
	ResolvedAt    *time.Time `json:"resolved_at,omitempty"`
}
