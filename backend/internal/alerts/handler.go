package alerts

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repository *Repository
}

func NewHandler(repository *Repository) *Handler {
	return &Handler{
		repository: repository,
	}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	alerts, err := h.repository.List(r.Context())
	if err != nil {
		http.Error(w, "failed to list alerts", http.StatusInternalServerError)
		return
	}

	if alerts == nil {
		alerts = []Alert{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts)
}

func (h *Handler) ListByApplication(
	w http.ResponseWriter,
	r *http.Request,
) {
	applicationID := chi.URLParam(r, "id")

	alerts, err := h.repository.ListByApplication(
		r.Context(),
		applicationID,
	)
	if err != nil {
		http.Error(
			w,
			"failed to list application alerts",
			http.StatusInternalServerError,
		)
		return
	}

	if alerts == nil {
		alerts = []Alert{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts)
}

func (h *Handler) ListFiltered(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	severity := r.URL.Query().Get("severity")

	alerts, err := h.repository.ListFiltered(
		r.Context(),
		status,
		severity,
	)
	if err != nil {
		http.Error(
			w,
			"failed to list filtered alerts",
			http.StatusInternalServerError,
		)
		return
	}

	if alerts == nil {
		alerts = []Alert{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts)
}
