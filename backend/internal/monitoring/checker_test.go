package monitoring

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestChecker(t *testing.T) {
	server := httptest.NewServer(
		http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		}),
	)

	defer server.Close()

	checker := NewChecker()

	result := checker.Check(
		context.Background(),
		server.URL,
	)

	if !result.Healthy {
		t.Fatalf("expected healthy result, got error: %s", result.Error)
	}

	if result.StatusCode != http.StatusOK {
		t.Fatalf(
			"expected status 200, got %d",
			result.StatusCode,
		)
	}

	if result.Latency <= 0 {
		t.Fatal("expected latency measurement")
	}
}
