package applications

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

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateApplicationRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Endpoint == "" {
		http.Error(
			w,
			`{"error":"name and endpoint are required"}`,
			http.StatusBadRequest,
		)
		return
	}

	if err := ValidateEndpoint(req.Endpoint); err != nil {
		http.Error(
			w,
			`{"error":"invalid endpoint"}`,
			http.StatusBadRequest,
		)
		return
	}

	app, err := h.repository.Create(r.Context(), req)
	if err != nil {
		http.Error(
			w,
			`{"error":"failed to create application"}`,
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(app)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	applications, err := h.repository.List(r.Context())
	if err != nil {
		http.Error(
			w,
			`{"error":"failed to fetch applications"}`,
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(applications)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if id == "" {
		http.Error(
			w,
			`{"error":"application id is required"}`,
			http.StatusBadRequest,
		)
		return
	}

	app, err := h.repository.GetByID(r.Context(), id)
	if err != nil {
		http.Error(
			w,
			`{"error":"application not found"}`,
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(app)
}
