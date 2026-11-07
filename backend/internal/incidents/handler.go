package incidents

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
	incidents, err := h.repository.List(r.Context())
	if err != nil {
		http.Error(w, "failed to list incidents", http.StatusInternalServerError)
		return
	}

	if incidents == nil {
		incidents = []Incident{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incidents)
}

func (h *Handler) ListByApplication(
	w http.ResponseWriter,
	r *http.Request,
) {
	applicationID := chi.URLParam(r, "id")

	incidents, err := h.repository.ListByApplication(
		r.Context(),
		applicationID,
	)
	if err != nil {
		http.Error(
			w,
			"failed to list application incidents",
			http.StatusInternalServerError,
		)
		return
	}

	if incidents == nil {
		incidents = []Incident{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(incidents)
}

func (h *Handler) ListEvents(
	w http.ResponseWriter,
	r *http.Request,
) {
	incidentID := chi.URLParam(r, "id")

	events, err := h.repository.ListEvents(
		r.Context(),
		incidentID,
	)
	if err != nil {
		http.Error(
			w,
			"failed to list incident events",
			http.StatusInternalServerError,
		)
		return
	}

	if events == nil {
		events = []IncidentEvent{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func (h *Handler) Stats(
	w http.ResponseWriter,
	r *http.Request,
) {
	stats, err := h.repository.GetStats(r.Context())
	if err != nil {
		http.Error(
			w,
			"failed to get incident statistics",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
