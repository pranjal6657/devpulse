package monitoring

import (
	"context"
	"log"
	"time"

	"github.com/pranjal6657/devpulse/internal/alerts"
)

type ApplicationSource interface {
	ListEndpoints(ctx context.Context) ([]MonitoredApplication, error)

	UpdateStatus(
		ctx context.Context,
		id string,
		status string,
	) error
}

type MonitoredApplication struct {
	ID       string
	Name     string
	Endpoint string
}

type Worker struct {
	checker    *Checker
	source     ApplicationSource
	repository *ResultRepository
	evaluator  *alerts.Evaluator
}

func NewWorker(
	checker *Checker,
	source ApplicationSource,
	repository *ResultRepository,
	evaluator *alerts.Evaluator,
) *Worker {
	return &Worker{
		checker:    checker,
		source:     source,
		repository: repository,
		evaluator:  evaluator,
	}
}

func (w *Worker) Start(ctx context.Context) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	log.Println("Monitoring worker started")

	w.check(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Monitoring worker stopped")
			return

		case <-ticker.C:
			w.check(ctx)
		}
	}
}

func (w *Worker) check(ctx context.Context) {
	applications, err := w.source.ListEndpoints(ctx)
	if err != nil {
		log.Printf("monitoring: failed to load applications: %v", err)
		return
	}

	for _, app := range applications {
		result := w.checker.Check(ctx, app.Endpoint)

		health := CalculateHealth(result)

		log.Printf(
			"monitoring: %s health=%s status=%d latency=%s",
			app.Name,
			health,
			result.StatusCode,
			result.Latency,
		)

		if err := w.source.UpdateStatus(
			ctx,
			app.ID,
			string(health),
		); err != nil {
			log.Printf(
				"monitoring: failed to update status for %s: %v",
				app.Name,
				err,
			)
		}

		if err := w.repository.Save(ctx, app.ID, result); err != nil {
			log.Printf(
				"monitoring: failed to save result for %s: %v",
				app.Name,
				err,
			)
		}

		if err := w.evaluator.Evaluate(
			ctx,
			app.ID,
			alerts.EvaluationInput{
				Healthy:    result.Healthy,
				StatusCode: result.StatusCode,
				Latency:    result.Latency,
				Error:      result.Error,
			},
		); err != nil {
			log.Printf("monitoring: alert evaluation failed for %s: %v", app.Name, err)
		}

		if result.Error != "" {
			log.Printf(
				"monitoring: %s DOWN - %s",
				app.Name,
				result.Error,
			)
			continue
		}

		log.Printf(
			"monitoring: %s status=%d latency=%s",
			app.Name,
			result.StatusCode,
			result.Latency,
		)
	}
}
