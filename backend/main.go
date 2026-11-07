package main

import (
	"context"
	"log"
	"net/http"

	"github.com/pranjal6657/devpulse/internal/alerts"
	"github.com/pranjal6657/devpulse/internal/api"
	"github.com/pranjal6657/devpulse/internal/applications"
	"github.com/pranjal6657/devpulse/internal/config"
	"github.com/pranjal6657/devpulse/internal/database"
	"github.com/pranjal6657/devpulse/internal/incidents"
	"github.com/pranjal6657/devpulse/internal/logs"
	"github.com/pranjal6657/devpulse/internal/monitoring"

	"github.com/pranjal6657/devpulse/internal/telemetry"
)

func main() {

	cfg := config.Load()

	if err := telemetry.InitMetrics(); err != nil {
		log.Fatal(err)
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	log.Println("Database connected successfully")

	applicationRepository := applications.NewRepository(db)
	applicationHandler := applications.NewHandler(applicationRepository)

	// Create monitoring engine
	checker := monitoring.NewChecker()

	resultRepository := monitoring.NewResultRepository(db)
	monitoringHandler := monitoring.NewHandler(resultRepository)

	incidentRepository := incidents.NewRepository(db)
	incidentService := incidents.NewService(incidentRepository)
	incidentHandler := incidents.NewHandler(incidentRepository)

	alertRepository := alerts.NewRepository(db)
	alertEvaluator := alerts.NewEvaluator(
		alertRepository,
		incidentService,
	)

	logRepository := logs.NewRepository(db)
	logHandler := logs.NewHandler(logRepository)
	alertHandler := alerts.NewHandler(alertRepository)

	worker := monitoring.NewWorker(
		checker,
		applicationRepository,
		resultRepository,
		alertEvaluator,
	)

	// Start monitoring in the background
	ctx := context.Background()
	go worker.Start(ctx)

	router := api.NewRouter(
		applicationHandler,
		monitoringHandler,
		alertHandler,
		incidentHandler,
		logHandler,
	)

	addr := ":" + cfg.Port

	log.Println("DevPulse backend running on http://localhost" + addr)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}
}
