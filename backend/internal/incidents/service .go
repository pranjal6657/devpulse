package incidents

import "context"

type Service struct {
	repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		repository: repository,
	}
}

func (s *Service) HandleAlert(
	ctx context.Context,
	applicationID string,
	title string,
	severity string,
) error {

	if severity != "CRITICAL" {
		return nil
	}

	exists, err := s.repository.HasOpenIncident(
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

	incidentID, err := s.repository.Create(
		ctx,
		applicationID,
		title,
	)
	if err != nil {
		return err
	}

	return s.repository.AddEvent(
		ctx,
		incidentID,
		"INCIDENT_CREATED",
		"Application health check failed.",
	)
}

func (s *Service) ResolveAlert(
	ctx context.Context,
	applicationID string,
	title string,
) error {
	return s.repository.ResolveOpenIncident(
		ctx,
		applicationID,
		title,
	)
}
