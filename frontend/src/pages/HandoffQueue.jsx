import { api } from "../api";
import { useApiData } from "../useApiData";
import { PriorityPill, SentimentPill, BooleanPill } from "../components/StatusPill";

export default function HandoffQueue() {
  const { data, error, loading } = useApiData(() => api.getHandoffCases(), []);

  return (
    <div>
      <h2>Handoff Queue</h2>
      <p className="page-subtitle">Calls flagged for human or pharmacist follow-up — action needed.</p>

      {loading && <div className="loading">Loading queue…</div>}
      {error && <div className="error-banner">Failed to load handoff queue: {error}</div>}

      {data && (
        <div className="table-wrap">
          {data.length === 0 ? (
            <div className="empty-state">Nothing needs attention right now.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Flagged</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>Sentiment</th>
                  <th>Pharmacist</th>
                  <th>Delivery Confirmed</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id}>
                    <td className="muted">{new Date(a.created_at).toLocaleString()}</td>
                    <td>{a.issue_type}</td>
                    <td><PriorityPill value={a.priority} /></td>
                    <td><SentimentPill value={a.sentiment} /></td>
                    <td><BooleanPill value={a.pharmacist_required} /></td>
                    <td><BooleanPill value={a.delivery_confirmed} /></td>
                    <td className="transcript-cell">{a.ai_summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
