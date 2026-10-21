import { SAMPLE_NOW } from "@/lib/sample-clock";

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const EXPLICIT_ZONE = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Zone-less ISO datetimes from the API are UTC. */
function parseApiTimestamp(iso: string): number {
  const value = iso.trim();
  if (EXPLICIT_ZONE.test(value) || DATE_ONLY.test(value)) return Date.parse(value);
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return Date.parse(`${normalized}Z`);
}

export function formatMoney(amount: string, currency = "USD"): string {
  const value = Number(amount);
  if (Number.isNaN(value)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDateTime(iso: string): string {
  const value = parseApiTimestamp(iso);
  if (Number.isNaN(value)) return iso;
  return new Intl.DateTimeFormat("en-US", DATE_TIME_FORMAT).format(value);
}

export function formatRelative(iso: string, now = SAMPLE_NOW): string {
  const delta = Math.max(0, now - parseApiTimestamp(iso));
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
