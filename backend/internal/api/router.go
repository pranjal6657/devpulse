package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"github.com/pranjal6657/devpulse/internal/alerts"
	"github.com/pranjal6657/devpulse/internal/applications"
	"github.com/pranjal6657/devpulse/internal/incidents"
	"github.com/pranjal6657/devpulse/internal/logs"
	"github.com/pranjal6657/devpulse/internal/middleware"
	"github.com/pranjal6657/devpulse/internal/monitoring"
	"github.com/pranjal6657/devpulse/internal/telemetry"
)

func NewRouter(
	appHandler *applications.Handler,
	monitoringHandler *monitoring.Handler,
	alertHandler *alerts.Handler,
	incidentHandler *incidents.Handler,
	logHandler *logs.Handler,
) http.Handler {

	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
		},
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-CSRF-Token",
		},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	router.Use(middleware.Recovery)
	router.Use(middleware.RequestID)
	router.Use(middleware.Logging)
	router.Use(middleware.SecurityHeaders)

	// Health
	router.Get("/api/health", healthHandler)

	// Applications
	router.Post("/api/applications", appHandler.Create)
	router.Get("/api/applications", appHandler.List)
	router.Get("/api/applications/{id}", appHandler.GetByID)

	// Monitoring
	router.Get(
		"/api/applications/{id}/monitoring",
		monitoringHandler.List,
	)

	router.Get(
		"/api/applications/{id}/uptime",
		monitoringHandler.Uptime,
	)

	router.Get(
		"/api/applications/{id}/latency",
		monitoringHandler.LatencyStats,
	)

	// Logs
	router.Post(
		"/api/logs",
		logHandler.Ingest,
	)

	router.Post(
		"/api/applications/{id}/logs",
		logHandler.Create,
	)

	router.Get(
		"/api/applications/{id}/logs",
		logHandler.List,
	)

	// Alerts
	router.Get(
		"/api/alerts",
		alertHandler.ListFiltered,
	)

	router.Get(
		"/api/applications/{id}/alerts",
		alertHandler.ListByApplication,
	)

	// Incidents
	router.Get(
		"/api/incidents",
		incidentHandler.List,
	)

	router.Get(
		"/api/incidents/stats",
		incidentHandler.Stats,
	)

	router.Get(
		"/api/applications/{id}/incidents",
		incidentHandler.ListByApplication,
	)

	router.Get(
		"/api/incidents/{id}/events",
		incidentHandler.ListEvents,
	)

	// Prometheus metrics
	router.Handle(
		"/metrics",
		telemetry.MetricsHandler(),
	)

	return router
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	w.Write([]byte(`{"status":"ok","service":"devpulse-backend"}`))
}
