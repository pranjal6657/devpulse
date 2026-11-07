package telemetry

import (
	"context"
	"net/http"

	"github.com/prometheus/client_golang/prometheus/promhttp"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/metric"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
)

var meter metric.Meter
var prometheusExporter *prometheus.Exporter

var (
	HTTPRequestsTotal   metric.Int64Counter
	HTTPRequestDuration metric.Float64Histogram
)

func InitMetrics() error {
	exporter, err := prometheus.New()
	if err != nil {
		return err
	}

	prometheusExporter = exporter

	provider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(exporter),
	)

	otel.SetMeterProvider(provider)

	meter = provider.Meter("devpulse")

	HTTPRequestsTotal, err = meter.Int64Counter(
		"devpulse_http_requests_total",
		metric.WithDescription(
			"Total number of HTTP requests handled by DevPulse",
		),
	)
	if err != nil {
		return err
	}

	HTTPRequestDuration, err = meter.Float64Histogram(
		"devpulse_http_request_duration_ms",
		metric.WithDescription(
			"HTTP request duration in milliseconds",
		),
	)
	if err != nil {
		return err
	}

	return nil
}

func MetricsHandler() http.Handler {
	return promhttp.Handler()
}

func RecordHTTPRequest(
	ctx context.Context,
	method string,
	path string,
	status int,
	durationMS float64,
) {
	HTTPRequestsTotal.Add(
		ctx,
		1,
		metric.WithAttributes(
			attribute.String("http.method", method),
			attribute.String("http.route", path),
			attribute.Int("http.status_code", status),
		),
	)

	HTTPRequestDuration.Record(
		ctx,
		durationMS,
		metric.WithAttributes(
			attribute.String("http.method", method),
			attribute.String("http.route", path),
		),
	)
}
