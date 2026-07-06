const PRIORITY_MAP = {
  low: "pill-good",
  medium: "pill-warning",
  high: "pill-serious",
  critical: "pill-critical",
};

const SENTIMENT_MAP = {
  positive: "pill-good",
  neutral: "pill-neutral",
  concerned: "pill-warning",
  angry: "pill-critical",
};

const DELIVERY_MAP = {
  PENDING: "pill-neutral",
  OUT_FOR_DELIVERY: "pill-warning",
  DELIVERED: "pill-good",
  CANCELLED: "pill-critical",
};

const CALL_STATUS_MAP = {
  QUEUED: "pill-neutral",
  IN_PROGRESS: "pill-warning",
  COMPLETED: "pill-good",
  FAILED: "pill-critical",
  SIMULATED: "pill-neutral",
};

function Pill({ value, className }) {
  if (!value) return <span className="muted">—</span>;
  return <span className={`pill ${className || "pill-neutral"}`}>{value}</span>;
}

export function PriorityPill({ value }) {
  return <Pill value={value} className={PRIORITY_MAP[value]} />;
}

export function SentimentPill({ value }) {
  return <Pill value={value} className={SENTIMENT_MAP[value]} />;
}

export function DeliveryStatusPill({ value }) {
  return <Pill value={value} className={DELIVERY_MAP[value]} />;
}

export function CallStatusPill({ value }) {
  return <Pill value={value} className={CALL_STATUS_MAP[value]} />;
}

export function BooleanPill({ value, trueLabel = "Yes", falseLabel = "No" }) {
  return (
    <Pill
      value={value ? trueLabel : falseLabel}
      className={value ? "pill-good" : "pill-neutral"}
    />
  );
}
