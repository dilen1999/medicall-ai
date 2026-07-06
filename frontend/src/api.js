const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getCustomers: () => request("/customers?limit=500"),
  getOrders: () => request("/orders?limit=500"),
  getCalls: () => request("/calls"),
  getAnalyses: () => request("/analysis"),
  getHandoffCases: () => request("/analysis/handoff-cases"),
  getDailySummary: (reportDate) =>
    request(`/reports/daily-summary${reportDate ? `?report_date=${reportDate}` : ""}`),
};
