package monitoring

import "time"

type HealthStatus string

const (
	HealthHealthy  HealthStatus = "HEALTHY"
	HealthDegraded HealthStatus = "DEGRADED"
	HealthDown     HealthStatus = "DOWN"
)

func CalculateHealth(result CheckResult) HealthStatus {
	if !result.Healthy || result.StatusCode >= 400 {
		return HealthDown
	}

	if result.Latency > time.Second {
		return HealthDegraded
	}

	return HealthHealthy
}
