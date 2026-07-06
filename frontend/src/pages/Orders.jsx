import { api } from "../api";
import { useApiData } from "../useApiData";
import { DeliveryStatusPill, BooleanPill } from "../components/StatusPill";

export default function Orders() {
  const orders = useApiData(() => api.getOrders(), []);
  const customers = useApiData(() => api.getCustomers(), []);

  const loading = orders.loading || customers.loading;
  const error = orders.error || customers.error;

  const customerById = {};
  if (customers.data) {
    for (const c of customers.data) customerById[c.id] = c;
  }

  return (
    <div>
      <h2>Orders</h2>
      <p className="page-subtitle">Medicine orders and their delivery status.</p>

      {loading && <div className="loading">Loading orders…</div>}
      {error && <div className="error-banner">Failed to load orders: {error}</div>}

      {orders.data && (
        <div className="table-wrap">
          {orders.data.length === 0 ? (
            <div className="empty-state">No orders yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Rx Required</th>
                  <th>Total</th>
                  <th>Delivered</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((o) => {
                  const customer = customerById[o.customer_id];
                  return (
                    <tr key={o.id}>
                      <td>{o.order_reference}</td>
                      <td>{customer ? customer.full_name : <span className="muted">{o.customer_id}</span>}</td>
                      <td>
                        {o.items.length === 0 ? (
                          <span className="muted">—</span>
                        ) : (
                          o.items.map((item) => (
                            <div key={item.id}>
                              {item.medicine_name} × {item.quantity}
                            </div>
                          ))
                        )}
                      </td>
                      <td><DeliveryStatusPill value={o.delivery_status} /></td>
                      <td><BooleanPill value={o.prescription_required} /></td>
                      <td>${Number(o.total_amount).toFixed(2)}</td>
                      <td className="muted">
                        {o.delivery_date ? new Date(o.delivery_date).toLocaleString() : "—"}
                      </td>
                      <td className="muted">{new Date(o.created_at).toLocaleString()}</td>
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
