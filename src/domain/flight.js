export function formatPrice(price) {
  if (!price || typeof price.amount !== "number") return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(price.amount);
}

export function formatDuration(minutes) {
  if (typeof minutes !== "number" || minutes < 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime(timestamp) {
  if (typeof timestamp !== "number") return "";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(timestamp) {
  if (typeof timestamp !== "number") return "";
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function calculateBestScore(
  flight,
  minPrice,
  maxPrice,
  minDuration,
  maxDuration
) {
  if (!flight?.price || typeof flight.price.amount !== "number") return 0;
  const priceRange = maxPrice - minPrice || 1;
  const durationRange = maxDuration - minDuration || 1;
  const priceScore = 1 - (flight.price.amount - minPrice) / priceRange;
  const durationScore =
    1 - ((flight.durationMinutes ?? 0) - minDuration) / durationRange;
  return 0.6 * priceScore + 0.4 * durationScore;
}

export function getPriceConfidence(flight, allFlights) {
  if (!flight || !allFlights?.length) return "average";
  const sorted = [...allFlights].sort(
    (a, b) => a.price.amount - b.price.amount
  );
  const index = sorted.findIndex((f) => f.id === flight.id);
  if (index < 0) return "average";
  const pct = (index + 1) / sorted.length;
  if (pct <= 0.25) return "low";
  if (pct >= 0.75) return "high";
  return "average";
}

export function formatRupees(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
