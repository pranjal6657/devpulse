package logs

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

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

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	applicationID := chi.URLParam(r, "id")

	var request CreateLogRequest

	decoder := json.NewDecoder(r.Body)

	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	h.create(w, r, applicationID, request)
}

func (h *Handler) Ingest(w http.ResponseWriter, r *http.Request) {
	var request IngestLogRequest

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(request.ApplicationID) == "" {
		http.Error(w, "application_id is required", http.StatusBadRequest)
		return
	}

	h.create(w, r, request.ApplicationID, request.CreateLogRequest)
}

func (h *Handler) create(
	w http.ResponseWriter,
	r *http.Request,
	applicationID string,
	request CreateLogRequest,
) {
	request.Level = strings.ToUpper(strings.TrimSpace(request.Level))
	request.Message = strings.TrimSpace(request.Message)

	switch request.Level {
	case "INFO", "WARN", "ERROR":
	default:
		http.Error(
			w,
			"level must be INFO, WARN, or ERROR",
			http.StatusBadRequest,
		)
		return
	}

	if request.Message == "" {
		http.Error(w, "message is required", http.StatusBadRequest)
		return
	}

	if len(request.Message) > 10000 {
		http.Error(w, "message is too large", http.StatusBadRequest)
		return
	}

	if err := h.repository.Create(
		r.Context(),
		applicationID,
		request,
	); err != nil {
		http.Error(
			w,
			"failed to create log",
			http.StatusInternalServerError,
		)
		return
	}

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(map[string]string{
		"status": "created",
	})
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	applicationID := chi.URLParam(r, "id")

	level := strings.ToUpper(
		strings.TrimSpace(r.URL.Query().Get("level")),
	)

	limit := 50
	offset := 0

	if value := r.URL.Query().Get("limit"); value != "" {
		if _, err := fmt.Sscanf(value, "%d", &limit); err != nil {
			http.Error(w, "invalid limit", http.StatusBadRequest)
			return
		}
	}

	if value := r.URL.Query().Get("offset"); value != "" {
		if _, err := fmt.Sscanf(value, "%d", &offset); err != nil {
			http.Error(w, "invalid offset", http.StatusBadRequest)
			return
		}
	}

	if limit < 1 || limit > 100 {
		http.Error(w, "limit must be between 1 and 100", http.StatusBadRequest)
		return
	}

	if offset < 0 {
		http.Error(w, "offset cannot be negative", http.StatusBadRequest)
		return
	}

	logs, err := h.repository.ListByApplication(
		r.Context(),
		applicationID,
		level,
		limit,
		offset,
	)

	if err != nil {
		http.Error(
			w,
			"failed to list logs",
			http.StatusInternalServerError,
		)
		return
	}

	if logs == nil {
		logs = []Log{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
