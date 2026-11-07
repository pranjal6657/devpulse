package applications

import "time"

type Application struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	Endpoint    string    `json:"endpoint"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateApplicationRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
	Endpoint    string  `json:"endpoint"`
}
