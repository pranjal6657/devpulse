package alerts

import (
	"context"
	"time"
)

type IncidentHandler interface {
	HandleAlert(
		ctx context.Context,
		applicationID string,
		title string,
		severity string,
	) error

	ResolveAlert(
		ctx context.Context,
		applicationID string,
		title string,
	) error
}

type EvaluationInput struct {
	Healthy    bool
	StatusCode int
	Latency    time.Duration
	Error      string
}

type Evaluator struct {
	repository      *Repository
	incidentHandler IncidentHandler
}

func NewEvaluator(
	repository *Repository,
	incidentHandler IncidentHandler,
) *Evaluator {
	return &Evaluator{
		repository:      repository,
		incidentHandler: incidentHandler,
	}
}

func (e *Evaluator) Evaluate(
	ctx context.Context,
	applicationID string,
	input EvaluationInput,
) error {

	// Application is DOWN
	if !input.Healthy {
		title := "Application DOWN"

		exists, err := e.repository.HasActiveAlert(
			ctx,
			applicationID,
			title,
		)
		if err != nil {
			return err
		}

		if exists {
			return nil
		}

		description := "Application health check failed."

		if err := e.repository.Create(
			ctx,
			applicationID,
			title,
			description,
			"CRITICAL",
		); err != nil {
			return err
		}

		return e.incidentHandler.HandleAlert(
			ctx,
			applicationID,
			title,
			"CRITICAL",
		)
	}

	// Application recovered
	if err := e.repository.ResolveActiveAlert(
		ctx,
		applicationID,
		"Application DOWN",
	); err != nil {
		return err
	}

	if err := e.incidentHandler.ResolveAlert(
		ctx,
		applicationID,
		"Application DOWN",
	); err != nil {
		return err
	}

	// High latency
	if input.Latency >= time.Second {
		title := "High Latency"

		exists, err := e.repository.HasActiveAlert(
			ctx,
			applicationID,
			title,
		)
		if err != nil {
			return err
		}

		if exists {
			return nil
		}

		description := "Application response latency exceeded 1 second."

		return e.repository.Create(
			ctx,
			applicationID,
			title,
			description,
			"WARNING",
		)
	}

	// Latency recovered
	return e.repository.ResolveActiveAlert(
		ctx,
		applicationID,
		"High Latency",
	)
}
