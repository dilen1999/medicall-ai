import { api } from "../api";
import { useApiData } from "../useApiData";

export default function Customers() {
  const { data, error, loading } = useApiData(() => api.getCustomers(), []);

  return (
    <div>
      <h2>Customers</h2>
      <p className="page-subtitle">Everyone registered in the system.</p>

      {loading && <div className="loading">Loading customers…</div>}
      {error && <div className="error-banner">Failed to load customers: {error}</div>}

      {data && (
        <div className="table-wrap">
          {data.length === 0 ? (
            <div className="empty-state">No customers yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Language</th>
                  <th>Country</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td>{c.phone_number}</td>
                    <td>{c.email || <span className="muted">—</span>}</td>
                    <td>{c.language}</td>
                    <td>{c.country || <span className="muted">—</span>}</td>
                    <td className="muted">{new Date(c.created_at).toLocaleString()}</td>
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
