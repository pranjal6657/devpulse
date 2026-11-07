import {
  Activity,
  AlertTriangle,
  Bell,
  LayoutDashboard,
  List,
  ScrollText,
  Settings,
  Server,
  ArrowLeft,
  Search,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  createApplication,
  getAlerts,
  getApplication,
  getApplicationAlerts,
  getApplicationLogs,
  getApplications,
  getFilteredAlerts,
  getIncidentEvents,
  getIncidents,
  getMonitoringResults,
  getApplicationUptime,
  getApplicationLatency,
  type Application,
  type Alert,
  type Incident,
  type IncidentEvent,
  type Log,
  type MonitoringResult,
  type LatencyStats,
} from "./api"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type Page =
  | "dashboard"
  | "applications"
  | "application-details"
  | "alerts"
  | "incidents"
  | "logs"
  | "settings"

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  const [applications, setApplications] = useState<Application[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadData(showLoading = true) {
      try {
        if (showLoading) {
          setLoading(true)
        }

        setError("")

        const [applicationsData, alertsData, incidentsData] =
          await Promise.all([
            getApplications(),
            getAlerts(),
            getIncidents(),
          ])

        if (!isMounted) return

        setApplications(applicationsData)
        setAlerts(alertsData)
        setIncidents(incidentsData)
      } catch (err) {
        console.error("Failed to load dashboard data:", err)

        if (isMounted) {
          setError("Unable to load dashboard data")
        }
      } finally {
        if (isMounted && showLoading) {
          setLoading(false)
        }
      }
    }

    loadData(true)

    const interval = setInterval(() => {
      loadData(false)
    }, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const healthyCount = applications.filter(
    (app) => app.status === "HEALTHY",
  ).length

  const activeAlerts = alerts.filter(
    (alert) =>
      alert.status === "ACTIVE" ||
      alert.status === "OPEN",
  ).length

  const openIncidents = incidents.filter(
    (incident) => incident.status === "OPEN",
  ).length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 px-4 py-5">

          {/* Logo */}
          <div className="mb-8 flex items-center gap-3 px-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15">
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                DevPulse
              </h1>

              <p className="text-xs text-zinc-500">
                Observability
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">

            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={currentPage === "dashboard"}
              onClick={() => setCurrentPage("dashboard")}
            />

            <NavItem
              icon={<Server size={18} />}
              label="Applications"
              active={currentPage === "applications"}
              onClick={() => setCurrentPage("applications")}
            />

            <NavItem
              icon={<AlertTriangle size={18} />}
              label="Alerts"
              active={currentPage === "alerts"}
              onClick={() => setCurrentPage("alerts")}
            />

            <NavItem
              icon={<List size={18} />}
              label="Incidents"
              active={currentPage === "incidents"}
              onClick={() => setCurrentPage("incidents")}
            />

            <NavItem
              icon={<ScrollText size={18} />}
              label="Logs"
              active={currentPage === "logs"}
              onClick={() => setCurrentPage("logs")}
            />

          </nav>

          {/* Settings */}
          <div className="mt-8 border-t border-zinc-800 pt-4">
            <NavItem
              icon={<Settings size={18} />}
              label="Settings"
              active={currentPage === "settings"}
              onClick={() => setCurrentPage("settings")}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">

          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b border-zinc-800 px-8">

            <div>
              <h2 className="text-sm font-medium text-zinc-400">
                {getPageTitle(currentPage)}
              </h2>

              <p className="text-xs text-zinc-600">
                {getPageDescription(currentPage)}
              </p>
            </div>

            <button
              className="relative rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Notifications"
            >
              <Bell size={18} />

              {activeAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {activeAlerts}
                </span>
              )}
            </button>

          </header>

          {/* Page content */}
          {currentPage === "dashboard" && (
            <DashboardPage
              applications={applications}
              alerts={alerts}
              incidents={incidents}
              loading={loading}
              error={error}
              healthyCount={healthyCount}
              activeAlerts={activeAlerts}
              openIncidents={openIncidents}
              onSelectApplication={(id) => {
                setSelectedApplicationId(id)
                setCurrentPage("application-details")
              }}
            />
          )}

          {currentPage === "applications" && (
            <ApplicationsPage
              applications={applications}
              onSelectApplication={(id) => {
                setSelectedApplicationId(id)
                setCurrentPage("application-details")
              }}
            />
          )}

          {currentPage === "application-details" && selectedApplicationId && (
            <ApplicationDetailsPage
              applicationId={selectedApplicationId}
              onBack={() => setCurrentPage("applications")}
            />
          )}

          {currentPage === "alerts" && (
            <AlertsPage applications={applications} />
          )}

          {currentPage === "incidents" && (
            <IncidentsPage
              incidents={incidents}
              applications={applications}
            />
          )}

          {currentPage === "logs" && (
            <LogsPage applications={applications} />
    )}

          {currentPage === "settings" && (
            <ComingSoonPage
              title="Settings"
              description="Configure your DevPulse environment."
            />
          )}

        </main>
      </div>
    </div>
  )
}

/* ============================================================
   DASHBOARD
============================================================ */

function DashboardPage({
  applications,
  alerts,
  incidents,
  loading,
  error,
  healthyCount,
  activeAlerts,
  openIncidents,
  onSelectApplication,
}: {
  applications: Application[]
  alerts: Alert[]
  incidents: Incident[]
  loading: boolean
  error: string
  healthyCount: number
  activeAlerts: number
  openIncidents: number
  onSelectApplication: (id: string) => void
}) {
  const downCount = applications.filter(
    (app) => app.status === "DOWN",
  ).length

  const degradedCount = applications.filter(
    (app) => app.status === "DEGRADED",
  ).length

  const healthPercent =
    applications.length > 0
      ? Math.round((healthyCount / applications.length) * 100)
      : 0

  return (
    <section className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-medium uppercase tracking-widest text-emerald-400">
              System monitoring active
            </span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight">
            Overview
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Monitor the health and reliability of your services.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5">
          <p className="text-xs text-zinc-600">
            Overall health
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-semibold">
              {loading ? "—" : `${healthPercent}%`}
            </span>
            <span className="text-xs text-zinc-500">
              healthy
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Health summary */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Applications
            </span>
            <Server className="h-4 w-4 text-zinc-600 transition group-hover:text-zinc-400" />
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight">
            {loading ? "—" : applications.length}
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Registered services
          </p>
        </div>

        <div className="group rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-5 transition hover:border-emerald-800/60">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Healthy
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-emerald-400">
            {loading ? "—" : healthyCount}
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Services operating normally
          </p>
        </div>

        <div className="group rounded-xl border border-yellow-900/40 bg-yellow-950/10 p-5 transition hover:border-yellow-800/60">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Active Alerts
            </span>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-yellow-400">
            {loading ? "—" : activeAlerts}
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Require attention
          </p>
        </div>

        <div className="group rounded-xl border border-red-900/40 bg-red-950/10 p-5 transition hover:border-red-800/60">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">
              Open Incidents
            </span>
            <Bell className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-red-400">
            {loading ? "—" : openIncidents}
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Currently unresolved
          </p>
        </div>
      </div>

      {/* Health distribution */}
      {!loading && applications.length > 0 && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-zinc-200">
                System Health
              </h3>
              <p className="mt-1 text-xs text-zinc-600">
                Distribution of monitored services
              </p>
            </div>

            <span className="text-xs text-zinc-500">
              {applications.length} services
            </span>
          </div>

          <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
            {healthyCount > 0 && (
              <div
                className="bg-emerald-400 transition-all duration-500"
                style={{
                  width: `${(healthyCount / applications.length) * 100}%`,
                }}
              />
            )}

            {degradedCount > 0 && (
              <div
                className="bg-yellow-400 transition-all duration-500"
                style={{
                  width: `${(degradedCount / applications.length) * 100}%`,
                }}
              />
            )}

            {downCount > 0 && (
              <div
                className="bg-red-400 transition-all duration-500"
                style={{
                  width: `${(downCount / applications.length) * 100}%`,
                }}
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-5 text-xs">
            <span className="flex items-center gap-2 text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Healthy {healthyCount}
            </span>

            <span className="flex items-center gap-2 text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Degraded {degradedCount}
            </span>

            <span className="flex items-center gap-2 text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Down {downCount}
            </span>
          </div>
        </div>
      )}

      {/* Service health */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">
              Service Health
            </h3>
            <p className="mt-1 text-xs text-zinc-600">
              Current state of monitored applications
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-400">
              {healthyCount} healthy
            </span>
            {degradedCount > 0 && (
              <span className="text-yellow-400">
                {degradedCount} degraded
              </span>
            )}
            {downCount > 0 && (
              <span className="text-red-400">
                {downCount} down
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-600">
            Loading service health...
          </div>
        ) : applications.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Server className="mx-auto mb-3 h-7 w-7 text-zinc-700" />
            <p className="text-sm text-zinc-500">
              No applications registered
            </p>
            <p className="mt-1 text-xs text-zinc-700">
              Add an application to start monitoring.
            </p>
          </div>
        ) : (
          <div className="grid gap-px bg-zinc-800 md:grid-cols-2">
            {applications.map((application) => (
              <button
                key={application.id}
                type="button"
                onClick={() => onSelectApplication(application.id)}
                className="group w-full bg-zinc-950/80 px-5 py-4 text-left transition hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {application.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-600">
                      {application.endpoint}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Alerts + Incidents */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Alerts */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Recent Alerts
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Latest monitoring events
                </p>
              </div>
              {activeAlerts > 0 && (
                <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                  {activeAlerts} active
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-zinc-800">
            {alerts.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  No alerts
                </p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onSelectApplication={onSelectApplication}
                />
              ))
            )}
          </div>
        </div>

        {/* Incidents */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
          <div className="border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Recent Incidents
                </h3>
                <p className="mt-1 text-xs text-zinc-600">
                  Service reliability events
                </p>
              </div>
              {openIncidents > 0 && (
                <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                  {openIncidents} open
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-zinc-800">
            {incidents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Activity className="mx-auto mb-3 h-6 w-6 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  No incidents
                </p>
              </div>
            ) : (
              incidents.slice(0, 5).map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  onSelectApplication={onSelectApplication}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer status */}
      <div className="mt-6 flex items-center justify-between border-t border-zinc-900 pt-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs text-zinc-600">
            Monitoring pipeline operational
          </span>
        </div>
        <span className="text-xs text-zinc-700">
          DevPulse
        </span>
      </div>
    </section>
  )
}

/* ============================================================
   APPLICATIONS PAGE
============================================================ */

function ApplicationsPage({
  applications,
  onSelectApplication,
}: {
  applications: Application[]
  onSelectApplication: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")

  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const filteredApplications = applications.filter((application) => {
    const matchesSearch =
      application.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      application.endpoint
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesFilter =
      filter === "ALL" ||
      application.status === filter

    return matchesSearch && matchesFilter
  })

  async function handleCreateApplication() {
    if (!name.trim()) {
      setCreateError("Application name is required.")
      return
    }

    if (!endpoint.trim()) {
      setCreateError("Endpoint is required.")
      return
    }

    try {
      setCreating(true)
      setCreateError("")

      await createApplication({
        name: name.trim(),
        endpoint: endpoint.trim(),
        description: description.trim() || undefined,
      })

      // Clear form
      setName("")
      setEndpoint("")
      setDescription("")

      // Close modal
      setShowModal(false)

      // Refresh page so the new application appears
      window.location.reload()
    } catch (error) {
      console.error("Create application failed:", error)

      setCreateError(
        error instanceof Error
          ? error.message
          : "Failed to create application.",
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <section className="p-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Applications
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Monitor and manage your registered services.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateError("")
              setShowModal(true)
            }}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            + Add application
          </button>

        </div>

        {/* Search + filter */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />

            <input
              type="text"
              placeholder="Search applications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
            />

          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-300 outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="DEGRADED">Degraded</option>
            <option value="DOWN">Down</option>
            <option value="UNKNOWN">Unknown</option>
          </select>

        </div>

        {/* Application table */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">

          <div className="grid grid-cols-[2fr_2fr_1fr] border-b border-zinc-800 px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-600">
            <span>Application</span>
            <span>Endpoint</span>
            <span>Status</span>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">
              No applications found.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">

              {filteredApplications.map((application) => (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => onSelectApplication(application.id)}
                      className="grid w-full grid-cols-[2fr_2fr_1fr] items-center px-5 py-4 text-left transition hover:bg-zinc-900/70"
                    >

                  <div>
                    <p className="text-sm font-medium">
                      {application.name}
                    </p>

                    {application.description && (
                      <p className="mt-1 text-xs text-zinc-600">
                        {application.description}
                      </p>
                    )}
                  </div>

                  <p className="truncate pr-6 text-xs text-zinc-500">
                    {application.endpoint}
                  </p>

                  <div>
                    <StatusBadge status={application.status} />
                  </div>

                </button>
              ))}

            </div>
          )}

        </div>

        <p className="mt-3 text-xs text-zinc-600">
          Showing {filteredApplications.length} of{" "}
          {applications.length} applications
        </p>

      </section>

      {/* ADD APPLICATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

          <div
            className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Modal header */}
            <div className="mb-6">

              <h3 className="text-lg font-semibold">
                Add application
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Register a service for monitoring.
              </p>

            </div>

            {/* Error */}
            {createError && (
              <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {createError}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">
                  Application name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Payment API"
                  autoFocus
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                />
              </div>

              {/* Endpoint */}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">
                  Endpoint
                </label>

                <input
                  type="url"
                  value={endpoint}
                  onChange={(event) => setEndpoint(event.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-400">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Production payment service"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-indigo-500"
                />
              </div>

            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setCreateError("")
                }}
                className="rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={creating}
                onClick={handleCreateApplication}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create application"}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  )
}

/* ============================================================
   COMPONENTS
============================================================ */

function ApplicationDetailsPage({
  applicationId,
  onBack,
}: {
  applicationId: string
  onBack: () => void
}) {
  const [application, setApplication] = useState<Application | null>(null)
  const [monitoring, setMonitoring] = useState<MonitoringResult[]>([])
  const [uptime, setUptime] = useState<number | null>(null)
  const [latencyStats, setLatencyStats] =
    useState<LatencyStats | null>(null)
  const [applicationAlerts, setApplicationAlerts] = useState<Alert[]>([])
  const [applicationIncidents, setApplicationIncidents] = useState<Incident[]>([])
  const [applicationLogs, setApplicationLogs] = useState<Log[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadApplicationDetails(showLoading = true) {
      try {
        if (showLoading) {
          setLoading(true)
        }

        setError("")

        const [
          applicationResponse,
          monitoringResponse,
          uptimeResponse,
          latencyResponse,
          alertsResponse,
          incidentsResponse,
          logsResponse,
        ] = await Promise.all([
          getApplication(applicationId),
          getMonitoringResults(applicationId),
          getApplicationUptime(applicationId),
          getApplicationLatency(applicationId),
          getApplicationAlerts(applicationId),
          getIncidents(),
          getApplicationLogs(applicationId, "", 20, 0),
        ])

        if (!isMounted) return

        setApplication(applicationResponse)
        setMonitoring(monitoringResponse)
        setUptime(uptimeResponse.uptime_percent)
        setLatencyStats(latencyResponse)

        setApplicationAlerts(alertsResponse)

        setApplicationIncidents(
          incidentsResponse.filter(
            (incident) =>
              incident.application_id === applicationId,
          ),
        )

        setApplicationLogs(logsResponse)
      } catch (err) {
        console.error(
          "Failed to load application details:",
          err,
        )

        if (isMounted) {
          setError("Unable to load application monitoring data")
        }
      } finally {
        if (isMounted && showLoading) {
          setLoading(false)
        }
      }
    }

    loadApplicationDetails(true)

    const interval = setInterval(() => {
      loadApplicationDetails(false)
    }, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [applicationId])

  if (loading) {
    return (
      <section className="p-8">
        <p className="text-sm text-zinc-500">
          Loading application...
        </p>
      </section>
    )
  }

  if (error || !application) {
    return (
      <section className="p-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-200"
        >
          <ArrowLeft size={16} />
          Back to applications
        </button>

        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-sm text-red-400">
          {error || "Application not found"}
        </div>
      </section>
    )
  }

  const totalChecks = monitoring.length

  const successfulChecks = monitoring.filter(
    (result) => result.healthy,
  ).length

  const failedChecks = totalChecks - successfulChecks

  const calculatedUptime =
    totalChecks > 0
      ? (successfulChecks / totalChecks) * 100
      : 0

  const latencyValues = monitoring
    .filter((result) => result.latency_ms >= 0)
    .map((result) => result.latency_ms)

  const averageLatency =
    latencyValues.length > 0
      ? latencyValues.reduce((sum, value) => sum + value, 0) /
        latencyValues.length
      : 0

  const minimumLatency =
    latencyValues.length > 0
      ? Math.min(...latencyValues)
      : 0

  const maximumLatency =
    latencyValues.length > 0
      ? Math.max(...latencyValues)
      : 0

  const displayUptime = uptime ?? calculatedUptime
  const displayAverageLatency =
    latencyStats?.average_latency_ms ?? averageLatency
  const displayMinimumLatency =
    latencyStats?.minimum_latency_ms ?? minimumLatency
  const displayMaximumLatency =
    latencyStats?.maximum_latency_ms ?? maximumLatency

  const chartData = monitoring
    .slice(0, 20)
    .reverse()
    .map((result) => ({
      time: new Date(result.checked_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      latency: Number(result.latency_ms.toFixed(2)),
    }))

  return (
    <section className="p-8">

      {/* Back */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-200"
      >
        <ArrowLeft size={16} />
        Back to applications
      </button>

      {/* Application header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {application.name}
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {application.endpoint}
          </p>
        </div>

        <StatusBadge status={application.status} />
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">

        <StatCard
          label="Uptime"
          value={`${displayUptime.toFixed(2)}%`}
          description={`${successfulChecks} successful checks`}
          valueClassName={
            displayUptime >= 99
              ? "text-emerald-400"
              : displayUptime >= 95
                ? "text-yellow-400"
                : "text-red-400"
          }
        />

        <StatCard
          label="Avg Latency"
          value={`${displayAverageLatency.toFixed(2)} ms`}
          description="Average response time"
          valueClassName="text-indigo-400"
        />

        <StatCard
          label="Min Latency"
          value={`${displayMinimumLatency.toFixed(2)} ms`}
          description="Fastest response"
          valueClassName="text-emerald-400"
        />

        <StatCard
          label="Max Latency"
          value={`${displayMaximumLatency.toFixed(2)} ms`}
          description="Slowest response"
          valueClassName="text-yellow-400"
        />

      </div>

      {/* Latency chart */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">

        <div className="mb-5">
          <h2 className="text-sm font-semibold text-zinc-100">
            Latency History
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Response latency from recent health checks
          </p>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-zinc-600">
            No latency data available.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                />

                <XAxis
                  dataKey="time"
                  tick={{
                    fill: "#71717a",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "#71717a",
                    fontSize: 12,
                  }}
                  axisLine={false}
                  tickLine={false}
                  unit=" ms"
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="latency"
                  strokeWidth={2}
                  dot={false}
                />

              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* Application Alerts */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">

        <div className="border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-medium">
            Application Alerts
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Alerts generated for this application
          </p>
        </div>

        {applicationAlerts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No alerts for this application.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {applicationAlerts.slice(0, 10).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    {alert.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {alert.description ?? "No description"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      alert.severity === "CRITICAL"
                        ? "bg-red-500/10 text-red-400"
                        : alert.severity === "WARNING"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      alert.status === "ACTIVE" ||
                      alert.status === "OPEN"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Application Incidents */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-medium">Application Incidents</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Incident history for this application
          </p>
        </div>

        {applicationIncidents.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No incidents for this application.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {applicationIncidents.slice(0, 10).map((incident) => (
              <div
                key={incident.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {incident.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Started{" "}
                    {new Date(incident.started_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    incident.status === "OPEN"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {incident.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Logs */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h3 className="text-sm font-medium">Recent Logs</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Latest logs associated with this application
          </p>
        </div>

        {applicationLogs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No logs available.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {applicationLogs.slice(0, 20).map((log) => (
              <div
                key={log.id}
                className="grid gap-2 px-5 py-4 md:grid-cols-[auto_auto_1fr_auto]"
              >
                <div className="col-span-full flex items-center justify-between gap-4">
                  <span
                    className={`text-xs font-medium ${
                      log.level === "ERROR"
                        ? "text-red-400"
                        : log.level === "WARN"
                          ? "text-yellow-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="col-span-full">
                  <p className="text-sm text-zinc-300">
                    {log.message}
                  </p>
                  {log.service && (
                    <p className="mt-1 text-xs text-zinc-600">
                      Service: {log.service}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monitoring history */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">

        <div className="border-b border-zinc-800 px-5 py-4">

          <h3 className="text-sm font-medium">
            Monitoring History
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            Recent health checks performed by DevPulse
          </p>

        </div>

        {monitoring.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-500">
            No monitoring data available yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">

            {monitoring.slice(0, 20).map((result) => (
              <div
                key={result.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_2fr] items-center px-5 py-3"
              >

                <span className="text-xs text-zinc-500">
                  {new Date(
                    result.checked_at,
                  ).toLocaleString()}
                </span>

                <span
                  className={
                    result.healthy
                      ? "text-xs text-emerald-400"
                      : "text-xs text-red-400"
                  }
                >
                  {result.healthy ? "HEALTHY" : "FAILED"}
                </span>

                <span className="text-xs text-zinc-400">
                  HTTP {result.status_code || "—"}
                </span>

                <span className="text-xs text-zinc-500">
                  {result.latency_ms.toFixed(2)} ms
                </span>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">

          <h3 className="text-sm font-medium">
            Check Summary
          </h3>

          <div className="mt-4 space-y-3">

            <SummaryRow
              label="Total checks"
              value={totalChecks}
            />

            <SummaryRow
              label="Successful"
              value={successfulChecks}
            />

            <SummaryRow
              label="Failed"
              value={failedChecks}
            />

          </div>

        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">

          <h3 className="text-sm font-medium">
            Latency
          </h3>

          <div className="mt-4 space-y-3">

            <SummaryRow
              label="Average"
              value={`${averageLatency.toFixed(2)} ms`}
            />

            <SummaryRow
              label="Minimum"
              value={`${minimumLatency.toFixed(2)} ms`}
            />

            <SummaryRow
              label="Maximum"
              value={`${maximumLatency.toFixed(2)} ms`}
            />

          </div>

        </div>

      </div>

    </section>
  )
}

function StatCard({
  label,
  value,
  description,
  valueClassName = "text-zinc-100",
}: {
  label: string
  value: number | string
  description: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition hover:border-zinc-700">

      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className={`mt-2 text-3xl font-semibold ${valueClassName}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-600">
        {description}
      </p>

    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span className="text-sm font-medium text-zinc-200">
        {value}
      </span>
    </div>
  )
}

function StatusBadge({
  status,
}: {
  status: string
}) {
  const styles: Record<string, string> = {
    HEALTHY: "bg-emerald-500/10 text-emerald-400",
    DEGRADED: "bg-yellow-500/10 text-yellow-400",
    DOWN: "bg-red-500/10 text-red-400",
    UNKNOWN: "bg-zinc-800 text-zinc-400",
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? styles.UNKNOWN
      }`}
    >
      {status}
    </span>
  )
}

function AlertRow({
  alert,
  onSelectApplication,
}: {
  alert: Alert
  onSelectApplication: (id: string) => void
}) {
  const critical = alert.severity === "CRITICAL"

  return (
    <button
      type="button"
      onClick={() => onSelectApplication(alert.application_id)}
      className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-zinc-900"
    >

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {alert.title}
        </p>

        <p className="mt-1 truncate text-xs text-zinc-600">
          {alert.description ?? "No description"}
        </p>
      </div>

      <span
        className={`ml-4 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
          critical
            ? "bg-red-500/10 text-red-400"
            : "bg-yellow-500/10 text-yellow-400"
        }`}
      >
        {alert.severity}
      </span>

    </button>
  )
}

function IncidentRow({
  incident,
  onSelectApplication,
}: {
  incident: Incident
  onSelectApplication: (id: string) => void
}) {
  const open = incident.status === "OPEN"

  return (
    <button
      type="button"
      onClick={() => onSelectApplication(incident.application_id)}
      className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-zinc-900"
    >

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {incident.title}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          {new Date(incident.started_at).toLocaleString()}
        </p>
      </div>

      <span
        className={`ml-4 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
          open
            ? "bg-red-500/10 text-red-400"
            : "bg-emerald-500/10 text-emerald-400"
        }`}
      >
        {incident.status}
      </span>

    </button>
  )
}

function AlertsPage({
  applications,
}: {
  applications: Application[]
}) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [severityFilter, setSeverityFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true)
        setError("")

        const status =
          statusFilter === "ALL" ? undefined : statusFilter

        const severity =
          severityFilter === "ALL" ? undefined : severityFilter

        const data = await getFilteredAlerts(status, severity)

          console.log("ALERT API DATA:", data)
          console.log("ALERT API DATA TYPE:", typeof data)
          console.log("IS ARRAY:", Array.isArray(data))

          setAlerts(data)
      } catch (err) {
        console.error("Failed to load alerts:", err)
        setError("Unable to load alerts")
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [statusFilter, severityFilter])

  const getApplicationName = (applicationId: string) => {
    const application = applications.find(
      (app) => app.id === applicationId,
    )

    return application?.name ?? "Unknown application"
  }

  const criticalCount = alerts.filter(
    (alert) => alert.severity === "CRITICAL",
  ).length

  const warningCount = alerts.filter(
    (alert) => alert.severity === "WARNING",
  ).length

  const activeCount = alerts.filter(
    (alert) =>
      alert.status === "ACTIVE" ||
      alert.status === "OPEN",
  ).length

  return (
    <section className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Alerts
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Monitor and investigate application alerts.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active Alerts"
          value={activeCount}
          description="Currently active"
          valueClassName="text-red-400"
        />

        <StatCard
          label="Critical"
          value={criticalCount}
          description="Critical severity"
          valueClassName="text-red-400"
        />

        <StatCard
          label="Warnings"
          value={warningCount}
          description="Warning severity"
          valueClassName="text-yellow-400"
        />
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-300 outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={severityFilter}
          onChange={(event) =>
            setSeverityFilter(event.target.value)
          }
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-300 outline-none"
        >
          <option value="ALL">All severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Info</option>
        </select>
      </div>

      {/* Alert table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] border-b border-zinc-800 px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-600">
          <span>Alert</span>
          <span>Application</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Created</span>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            No alerts found.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {alerts.map((alert) => (
              <AlertTableRow
                key={alert.id}
                alert={alert}
                applicationName={getApplicationName(
                  alert.application_id,
                )}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        Showing {alerts.length} alerts
      </p>
    </section>
  )
}

function AlertTableRow({
  alert,
  applicationName,
}: {
  alert: Alert
  applicationName: string
}) {
  const severityStyles: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-400",
    WARNING: "bg-yellow-500/10 text-yellow-400",
    INFO: "bg-blue-500/10 text-blue-400",
  }

  const statusStyles: Record<string, string> = {
    ACTIVE: "bg-red-500/10 text-red-400",
    OPEN: "bg-red-500/10 text-red-400",
    RESOLVED: "bg-emerald-500/10 text-emerald-400",
  }

  return (
    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr] items-center px-5 py-4 transition hover:bg-zinc-900/70">
      {/* Alert */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-200">
          {alert.title}
        </p>

        {alert.description && (
          <p className="mt-1 truncate text-xs text-zinc-600">
            {alert.description}
          </p>
        )}
      </div>

      {/* Application */}
      <span className="truncate pr-4 text-sm text-zinc-400">
        {applicationName}
      </span>

      {/* Severity */}
      <span
        className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
          severityStyles[alert.severity] ??
          "bg-zinc-800 text-zinc-400"
        }`}
      >
        {alert.severity}
      </span>

      {/* Status */}
      <span
        className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
          statusStyles[alert.status] ??
          "bg-zinc-800 text-zinc-400"
        }`}
      >
        {alert.status}
      </span>

      {/* Created */}
      <span className="text-xs text-zinc-500">
        {new Date(alert.created_at).toLocaleString()}
      </span>
    </div>
  )
}


function LogsPage({
  applications,
}: {
  applications: Application[]
}) {
  const [selectedApplicationId, setSelectedApplicationId] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [search, setSearch] = useState("")
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)

  const pageSize = 20

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true)
        setError("")

        const selectedApplications = selectedApplicationId
          ? applications.filter(
              (application) =>
                application.id === selectedApplicationId,
            )
          : applications

        const responses = await Promise.all(
          selectedApplications.map((application) =>
            getApplicationLogs(application.id, "", 100, 0),
          ),
        )

        const combinedLogs = responses
          .flat()
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )

        setLogs(combinedLogs)
      } catch (err) {
        console.error("Failed to load logs:", err)
        setError("Unable to load logs")
      } finally {
        setLoading(false)
      }
    }

    if (applications.length > 0) {
      loadLogs()
    }
  }, [applications, selectedApplicationId])

  const filteredLogs = (applications.length > 0 ? logs : []).filter((log) => {
    const matchesLevel =
      !levelFilter || log.level === levelFilter

    const searchText = search.toLowerCase().trim()

    const matchesSearch =
      !searchText ||
      log.message.toLowerCase().includes(searchText) ||
      (log.service || "").toLowerCase().includes(searchText)

    return matchesLevel && matchesSearch
  })

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / pageSize),
  )

  const currentPage = Math.min(page, totalPages)

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const getApplicationName = (applicationId: string) => {
    return (
      applications.find(
        (application) => application.id === applicationId,
      )?.name || "Unknown application"
    )
  }

  return (
    <section className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-zinc-500" />

          <span className="text-xs uppercase tracking-widest text-zinc-600">
            Observability
          </span>
        </div>

        <h2 className="text-3xl font-semibold tracking-tight">
          Logs
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Search and investigate logs across your applications.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="mb-2 block text-xs text-zinc-600">
              Search
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search logs..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-zinc-600"
              />
            </div>
          </div>

          {/* Application */}
          <div>
            <label className="mb-2 block text-xs text-zinc-600">
              Application
            </label>

            <select
              value={selectedApplicationId}
              onChange={(event) =>
                setSelectedApplicationId(event.target.value)
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-zinc-600"
            >
              <option value="">ALL APPLICATIONS</option>

              {applications.map((application) => (
                <option
                  key={application.id}
                  value={application.id}
                >
                  {application.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <label className="mb-2 block text-xs text-zinc-600">
              Level
            </label>

            <select
              value={levelFilter}
              onChange={(event) =>
                setLevelFilter(event.target.value)
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-zinc-600"
            >
              <option value="">ALL LEVELS</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Log Stream */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-200">
              Log Stream
            </h3>

            <p className="mt-1 text-xs text-zinc-600">
              {filteredLogs.length} matching logs
            </p>
          </div>

          <span className="text-xs text-zinc-600">
            {loading ? "Refreshing..." : "Latest logs"}
          </span>
        </div>

        {/* Loading */}
        {loading && logs.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-zinc-600">
            Loading logs...
          </div>
        ) : paginatedLogs.length === 0 ? (
          /* Empty */
          <div className="px-5 py-16 text-center">
            <ScrollText className="mx-auto mb-3 h-7 w-7 text-zinc-700" />

            <p className="text-sm text-zinc-500">
              No logs found
            </p>

            <p className="mt-1 text-xs text-zinc-700">
              Try changing your filters or search query.
            </p>
          </div>
        ) : (
          /* Logs */
          <div className="divide-y divide-zinc-800">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="px-5 py-4 transition hover:bg-zinc-900/50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-4">
                    {/* Level */}
                    <span
                      className={`mt-0.5 w-12 shrink-0 text-[11px] font-semibold ${
                        log.level === "ERROR"
                          ? "text-red-400"
                          : log.level === "WARN"
                            ? "text-yellow-400"
                            : "text-zinc-500"
                      }`}
                    >
                      {log.level}
                    </span>

                    <div className="min-w-0">
                      {/* Message */}
                      <p className="break-words text-sm text-zinc-300">
                        {log.message}
                      </p>

                      {/* Metadata */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                        <span>
                          {getApplicationName(
                            log.application_id,
                          )}
                        </span>

                        {log.service && (
                          <>
                            <span className="text-zinc-800">
                              •
                            </span>

                            <span>{log.service}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 text-xs text-zinc-700">
                    {new Date(
                      log.created_at,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > pageSize && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-4">
            <span className="text-xs text-zinc-600">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                disabled={currentPage === 1}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              <button
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1),
                  )
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ComingSoonPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="p-8">

      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {title}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {description}
        </p>
      </div>

      <div className="flex min-h-64 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40">

        <div className="text-center">
          <Activity className="mx-auto mb-3 h-8 w-8 text-zinc-700" />

          <p className="text-sm text-zinc-500">
            This section is coming next.
          </p>
        </div>

      </div>
    </section>
  )
}

function IncidentsPage({
  incidents,
  applications,
}: {
  incidents: Incident[]
  applications: Application[]
}) {
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null)
  const [events, setEvents] = useState<IncidentEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [incidentLogs, setIncidentLogs] = useState<Log[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    if (!selectedIncident) {
      return
    }

    const selectedIncidentId = selectedIncident.id
    const selectedApplicationId = selectedIncident.application_id

    async function loadEvents() {
      try {
        setEventsLoading(true)
        setLogsLoading(true)

        const [eventsResponse, logsResponse] =
          await Promise.all([
            getIncidentEvents(selectedIncidentId),
            getApplicationLogs(selectedApplicationId),
          ])

        setEvents(eventsResponse)
          setIncidentLogs(logsResponse)
      } catch (error) {
        console.error(error)
        setEvents([])
          setIncidentLogs([])
      } finally {
        setEventsLoading(false)
        setLogsLoading(false)
      }
    }

    loadEvents()
  }, [selectedIncident])

  const getApplicationName = (applicationId: string) => {
    const application = applications.find(
      (app) => app.id === applicationId,
    )

    return application?.name ?? "Unknown application"
  }

  const filteredIncidents = incidents.filter((incident) => {
    return (
      statusFilter === "ALL" ||
      incident.status === statusFilter
    )
  })

  const openIncidents = incidents.filter(
    (incident) => incident.status === "OPEN",
  ).length

  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === "RESOLVED",
  ).length

  return (
    <section className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Incidents
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Investigate application failures and incident history.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Incidents"
          value={incidents.length}
          description="All recorded incidents"
        />

        <StatCard
          label="Open"
          value={openIncidents}
          description="Currently active"
          valueClassName="text-red-400"
        />

        <StatCard
          label="Resolved"
          value={resolvedIncidents}
          description="Resolved incidents"
          valueClassName="text-emerald-400"
        />
      </div>

      {/* Filter */}
      <div className="mb-5">
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-300 outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {selectedIncident && (
        <IncidentDetails
          incident={selectedIncident}
          applicationName={getApplicationName(
            selectedIncident.application_id,
          )}
          events={events}
          loading={eventsLoading}
          logs={incidentLogs}
          logsLoading={logsLoading}
          onClose={() => setSelectedIncident(null)}
        />
      )}

      {/* Incident table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr] border-b border-zinc-800 px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-600">
          <span>Incident</span>
          <span>Application</span>
          <span>Status</span>
          <span>Started</span>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            No incidents found.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredIncidents.map((incident) => (
              <IncidentTableRow
                key={incident.id}
                incident={incident}
                applicationName={getApplicationName(
                  incident.application_id,
                )}
                onClick={() => {
                  setEvents([])
                  setIncidentLogs([])
                  setSelectedIncident(incident)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        Showing {filteredIncidents.length} of{" "}
        {incidents.length} incidents
      </p>
    </section>
  )
}

function IncidentDetails({
  incident,
  applicationName,
  events,
  loading,
  logs,
  logsLoading,
  onClose,
}: {
  incident: Incident
  applicationName: string
  events: IncidentEvent[]
  loading: boolean
  logs: Log[]
  logsLoading: boolean
  onClose: () => void
}) {
  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-start justify-between border-b border-zinc-800 p-5">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {incident.title}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                incident.status === "OPEN"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              {incident.status}
            </span>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            {applicationName}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          Close
        </button>
      </div>

      <div className="grid gap-4 border-b border-zinc-800 p-5 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-600">
            Application
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            {applicationName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-600">
            Started
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            {new Date(
              incident.started_at,
            ).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-600">
            Resolved
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            {incident.resolved_at
              ? new Date(
                  incident.resolved_at,
                ).toLocaleString()
              : "Still active"}
          </p>
        </div>
      </div>

      <div className="p-5">
        <h4 className="mb-5 text-sm font-medium text-zinc-300">
          Incident Timeline
        </h4>

        {loading ? (
          <p className="text-sm text-zinc-500">
            Loading incident events...
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No timeline events recorded.
          </p>
        ) : (
          <div className="space-y-5">
            {events.map((event) => (
              <div
                key={event.id}
                className="relative flex gap-4"
              >
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-500" />

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-zinc-400">
                      {event.event_type}
                    </span>

                    <span className="text-xs text-zinc-600">
                      {new Date(
                        event.created_at,
                      ).toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {event.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-zinc-800 pt-6">
        <h4 className="mb-4 text-sm font-medium text-zinc-300">
          Related Logs
        </h4>

        {logsLoading ? (
          <p className="text-sm text-zinc-500">
            Loading logs...
          </p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No logs recorded for this application.
          </p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3"
              >
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    log.level === "ERROR"
                      ? "bg-red-500/10 text-red-400"
                      : log.level === "WARN"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {log.level}
                </span>

                <span className="text-xs text-zinc-500">
                  {log.service ?? "unknown"}
                </span>

                <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                  {log.message}
                </span>

                <span className="text-xs text-zinc-600">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IncidentTableRow({
  incident,
  applicationName,
  onClick,
}: {
  incident: Incident
  applicationName: string
  onClick: () => void
}) {
  const statusStyles: Record<string, string> = {
    OPEN: "bg-red-500/10 text-red-400",
    RESOLVED: "bg-emerald-500/10 text-emerald-400",
  }

  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[2fr_1.5fr_1fr_1.5fr] items-center px-5 py-4 text-left transition hover:bg-zinc-900/70"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-200">
          {incident.title}
        </p>

        <p className="mt-1 truncate text-xs text-zinc-600">
          ID: {incident.id}
        </p>
      </div>

      <span className="truncate pr-4 text-sm text-zinc-400">
        {applicationName}
      </span>

      <span
        className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
          statusStyles[incident.status] ??
          "bg-zinc-800 text-zinc-400"
        }`}
      >
        {incident.status}
      </span>

      <span className="text-xs text-zinc-500">
        {new Date(incident.started_at).toLocaleString()}
      </span>
    </button>
  )
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
        active
          ? "bg-zinc-900 text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function getPageTitle(page: Page) {
  switch (page) {
    case "dashboard":
      return "Overview"
    case "applications":
      return "Applications"
    case "application-details":
      return "Application Details"
    case "alerts":
      return "Alerts"
    case "incidents":
      return "Incidents"
    case "logs":
      return "Logs"
    case "settings":
      return "Settings"
  }
}

function getPageDescription(page: Page) {
  switch (page) {
    case "dashboard":
      return "Monitor your services"
    case "applications":
      return "Manage monitored applications"
    case "application-details":
      return "Application health and performance"
    case "alerts":
      return "Monitor active alerts"
    case "incidents":
      return "Investigate service incidents"
    case "logs":
      return "Search application logs"
    case "settings":
      return "Configure DevPulse"
  }
}

export default App