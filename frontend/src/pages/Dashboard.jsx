import { useState } from "react";
import { api } from "../api";
import { useApiData } from "../useApiData";
import StatTile from "../components/StatTile";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [reportDate, setReportDate] = useState(todayIso());
  const [appliedDate, setAppliedDate] = useState(todayIso());
  const { data, error, loading } = useApiData(
    () => api.getDailySummary(appliedDate),
    [appliedDate],
    { pollMs: 5000 }
  );

  return (
    <div>
      <h2>Daily Summary</h2>
      <p className="page-subtitle">Owner overview of call activity and outcomes for a given day.</p>

      <div className="date-picker-row">
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
        />
        <button onClick={() => setAppliedDate(reportDate)}>View</button>
      </div>

      {loading && <div className="loading">Loading summary…</div>}
      {error && <div className="error-banner">Failed to load summary: {error}</div>}

      {data && (
        <>
          <div className="stat-grid">
            <StatTile label="Total Calls" value={data.total_calls} />
            <StatTile label="Successful Deliveries" value={data.successful_deliveries} accent="good" />
            <StatTile label="Missing Items" value={data.missing_item_count} accent="warning" />
            <StatTile label="Wrong Medicine" value={data.wrong_medicine_count} accent="critical" />
            <StatTile label="Damaged Packages" value={data.damaged_package_count} accent="warning" />
            <StatTile label="Pharmacist Handoffs" value={data.pharmacist_handoff_count} accent="critical" />
            <StatTile label="High Priority Cases" value={data.high_priority_count} accent="critical" />
          </div>

          <div className="card">
            <h3>Urgent Cases</h3>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {data.urgent_cases_summary || "None."}
            </p>
          </div>

          <div className="card">
            <h3>Summary</h3>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.summary}</p>
          </div>
        </>
      )}
    </div>
  );
}
