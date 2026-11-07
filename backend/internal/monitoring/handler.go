package monitoring

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repository *ResultRepository
}

func NewHandler(repository *ResultRepository) *Handler {
	return &Handler{
		repository: repository,
	}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	applicationID := chi.URLParam(r, "id")

	limit := 50

	if value := r.URL.Query().Get("limit"); value != "" {
		parsed, err := strconv.Atoi(value)

		if err != nil || parsed < 1 || parsed > 200 {
			http.Error(
				w,
				`{"error":"limit must be between 1 and 200"}`,
				http.StatusBadRequest,
			)
			return
		}

		limit = parsed
	}

	results, err := h.repository.ListByApplication(
		r.Context(),
		applicationID,
		limit,
	)

	if err != nil {
		http.Error(
			w,
			`{"error":"failed to fetch monitoring history"}`,
			http.StatusInternalServerError,
		)
		return
	}

	if results == nil {
		results = []MonitoringResult{}
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(results)
}

func (h *Handler) Uptime(w http.ResponseWriter, r *http.Request) {
	applicationID := chi.URLParam(r, "id")

	uptime, err := h.repository.GetUptime(
		r.Context(),
		applicationID,
	)

	if err != nil {
		http.Error(
			w,
			`{"error":"failed to calculate uptime"}`,
			http.StatusInternalServerError,
		)
		return
	}

	response := map[string]interface{}{
		"application_id": applicationID,
		"uptime_percent": uptime,
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(response)
}

func (h *Handler) LatencyStats(w http.ResponseWriter, r *http.Request) {
	applicationID := chi.URLParam(r, "id")

	stats, err := h.repository.GetLatencyStats(r.Context(), applicationID)
	if err != nil {
		http.Error(w, "failed to get latency statistics", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
