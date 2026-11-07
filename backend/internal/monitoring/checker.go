package monitoring

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

type CheckResult struct {
	Healthy    bool
	StatusCode int
	Latency    time.Duration
	Error      string
}

type Checker struct {
	client *http.Client
}

func NewChecker() *Checker {
	return &Checker{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Checker) Check(
	ctx context.Context,
	endpoint string,
) CheckResult {

	start := time.Now()

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		endpoint,
		nil,
	)
	if err != nil {
		return CheckResult{
			Healthy: false,
			Error:   err.Error(),
		}
	}

	resp, err := c.client.Do(req)

	latency := time.Since(start)

	if err != nil {
		return CheckResult{
			Healthy: false,
			Latency: latency,
			Error:   err.Error(),
		}
	}

	defer resp.Body.Close()

	healthy := resp.StatusCode >= 200 && resp.StatusCode < 400

	result := CheckResult{
		Healthy:    healthy,
		StatusCode: resp.StatusCode,
		Latency:    latency,
	}

	if !healthy {
		result.Error = fmt.Sprintf(
			"unexpected HTTP status: %d",
			resp.StatusCode,
		)
	}

	return result
}
