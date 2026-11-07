package monitoring

import (
	"testing"
	"time"
)

func TestCalculateHealth(t *testing.T) {
	tests := []struct {
		name     string
		result   CheckResult
		expected HealthStatus
	}{
		{
			name: "healthy application",
			result: CheckResult{
				Healthy:    true,
				StatusCode: 200,
				Latency:    200 * time.Millisecond,
			},
			expected: HealthHealthy,
		},
		{
			name: "slow application",
			result: CheckResult{
				Healthy:    true,
				StatusCode: 200,
				Latency:    1500 * time.Millisecond,
			},
			expected: HealthDegraded,
		},
		{
			name: "server error",
			result: CheckResult{
				Healthy:    false,
				StatusCode: 500,
				Latency:    300 * time.Millisecond,
			},
			expected: HealthDown,
		},
		{
			name: "connection failure",
			result: CheckResult{
				Healthy: false,
				Error:   "connection refused",
			},
			expected: HealthDown,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := CalculateHealth(test.result)

			if got != test.expected {
				t.Fatalf(
					"expected %s, got %s",
					test.expected,
					got,
				)
			}
		})
	}
}
