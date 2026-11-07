const API_BASE_URL = "http://localhost:8080/api"

export type Application = {
  id: string
  name: string
  description?: string
  endpoint: string
  status: string
  created_at: string
  updated_at: string
}

export type Alert = {
  id: string
  application_id: string
  title: string
  description?: string
  severity: string
  status: string
  created_at: string
  resolved_at?: string
}

export type Incident = {
  id: string
  application_id: string
  title: string
  status: string
  started_at: string
  resolved_at?: string
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getApplications() {
  return request<Application[]>("/applications")
}


export function getAlerts() {
  return request<Alert[]>("/alerts")
}

export function getIncidents() {
  return request<Incident[]>("/incidents")
}
export type IncidentEvent = {
  id: number
  incident_id: string
  event_type: string
  message: string
  created_at: string
}

export function getIncidentEvents(id: string) {
  return request<IncidentEvent[]>(
    `/incidents/${id}/events`,
  )
}


export type Log = {
  id: number
  application_id: string
  level: string
  service?: string
  message: string
  created_at: string
}


export function getApplicationAlerts(id: string) {
  return request<Alert[]>(
    `/applications/${id}/alerts`,
  )
}

export function getApplicationLogs(
  applicationId: string,
  level = "",
  limit = 50,
  offset = 0,
) {
  const params = new URLSearchParams()

  if (level) params.set("level", level)

  params.set("limit", String(limit))
  params.set("offset", String(offset))

  return request<Log[]>(
    `/applications/${applicationId}/logs?${params.toString()}`,
  )
}

export function createApplication(data: {
  name: string
  description?: string
  endpoint: string
}) {
  return request<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function getApplication(id: string) {
  return request<Application>(`/applications/${id}`)
}

export type MonitoringResult = {
  id: number
  application_id: string
  healthy: boolean
  status_code: number
  latency_ms: number
  error_message?: string
  checked_at: string
}

export type UptimeStats = {
  application_id: string
  uptime_percent: number
}

export type LatencyStats = {
  application_id: string
  average_latency_ms: number
  minimum_latency_ms: number
  maximum_latency_ms: number
  total_checks: number
  successful_checks: number
  failed_checks: number
}

export function getMonitoringResults(id: string) {
  return request<MonitoringResult[]>(
    `/applications/${id}/monitoring`,
  )
}

export function getApplicationUptime(id: string) {
  return request<UptimeStats>(
    `/applications/${id}/uptime`,
  )
}

export function getApplicationLatency(id: string) {
  return request<LatencyStats>(
    `/applications/${id}/latency`,
  )
}

export function getFilteredAlerts(status?: string, severity?: string) {
  const params = new URLSearchParams()

  if (status) params.set("status", status)
  if (severity) params.set("severity", severity)

  const query = params.toString()

  return request<Alert[]>(
    `/alerts${query ? `?${query}` : ""}`,
  )
}