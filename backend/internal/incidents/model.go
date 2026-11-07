package incidents

import "time"

type Incident struct {
	ID            string     `json:"id"`
	ApplicationID string     `json:"application_id"`
	Title         string     `json:"title"`
	Status        string     `json:"status"`
	StartedAt     time.Time  `json:"started_at"`
	ResolvedAt    *time.Time `json:"resolved_at,omitempty"`
}
