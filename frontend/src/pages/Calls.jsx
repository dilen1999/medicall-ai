import { api } from "../api";
import { useApiData } from "../useApiData";
import { CallStatusPill, PriorityPill, SentimentPill } from "../components/StatusPill";

export default function Calls() {
  const calls = useApiData(() => api.getCalls(), [], { pollMs: 5000 });
  const customers = useApiData(() => api.getCustomers(), []);
  const orders = useApiData(() => api.getOrders(), []);
  const analyses = useApiData(() => api.getAnalyses(), [], { pollMs: 5000 });

  const loading = calls.loading || customers.loading || orders.loading || analyses.loading;
  const error = calls.error || customers.error || orders.error || analyses.error;

  const customerById = {};
  if (customers.data) for (const c of customers.data) customerById[c.id] = c;

  const orderById = {};
  if (orders.data) for (const o of orders.data) orderById[o.id] = o;

  const analysisByCallId = {};
  if (analyses.data) for (const a of analyses.data) analysisByCallId[a.call_log_id] = a;

  return (
    <div>
      <h2>Calls</h2>
      <p className="page-subtitle">Every real and simulated confirmation call, with AI analysis where available.</p>

      {loading && <div className="loading">Loading calls…</div>}
      {error && <div className="error-banner">Failed to load calls: {error}</div>}

      {calls.data && (
        <div className="table-wrap">
          {calls.data.length === 0 ? (
            <div className="empty-state">No calls yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Customer</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Transcript</th>
                  <th>Issue</th>
                  <th>Sentiment</th>
                  <th>Priority</th>
                  <th>Handoff</th>
                </tr>
              </thead>
              <tbody>
                {calls.data.map((call) => {
                  const customer = customerById[call.customer_id];
                  const order = orderById[call.order_id];
                  const analysis = analysisByCallId[call.id];
                  return (
                    <tr key={call.id}>
                      <td className="muted">
                        {call.call_started_at ? new Date(call.call_started_at).toLocaleString() : "—"}
                      </td>
                      <td>{customer ? customer.full_name : <span className="muted">{call.customer_id}</span>}</td>
                      <td>{order ? order.order_reference : <span className="muted">{call.order_id}</span>}</td>
                      <td><CallStatusPill value={call.call_status} /></td>
                      <td className="transcript-cell">
                        {call.transcript || <span className="muted">No transcript</span>}
                      </td>
                      <td>{analysis ? analysis.issue_type : <span className="muted">—</span>}</td>
                      <td>{analysis ? <SentimentPill value={analysis.sentiment} /> : <span className="muted">—</span>}</td>
                      <td>{analysis ? <PriorityPill value={analysis.priority} /> : <span className="muted">—</span>}</td>
                      <td>
                        {analysis ? (
                          analysis.handoff_required || analysis.pharmacist_required ? (
                            <span className="pill pill-critical">Required</span>
                          ) : (
                            <span className="pill pill-good">No</span>
                          )
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
