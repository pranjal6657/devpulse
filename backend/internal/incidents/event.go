package incidents

import "time"

type IncidentEvent struct {
	ID         int64     `json:"id"`
	IncidentID string    `json:"incident_id"`
	EventType  string    `json:"event_type"`
	Message    string    `json:"message"`
	CreatedAt  time.Time `json:"created_at"`
}
