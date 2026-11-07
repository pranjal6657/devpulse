package logging

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Log struct {
	ApplicationID string `json:"application_id"`
	Level         string `json:"level"`
	Service       string `json:"service,omitempty"`
	Message       string `json:"message"`
}

func Send(baseURL string, log Log) error {
	data, err := json.Marshal(log)
	if err != nil {
		return err
	}

	resp, err := http.Post(
		baseURL+"/api/logs",
		"application/json",
		bytes.NewBuffer(data),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("log ingestion failed: %s", resp.Status)
	}

	return nil
}
