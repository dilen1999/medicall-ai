export default function StatTile({ label, value, accent }) {
  return (
    <div className={`stat-tile ${accent ? `accent-${accent}` : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
