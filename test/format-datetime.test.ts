import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDateTime, formatRelative } from "../src/lib/format.ts";

const utcPaidAt = "2026-10-21T04:00:00.000Z";

function localDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(Date.parse(iso));
}

test("formatDateTime renders API timestamps in the viewer timezone", () => {
  assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, "America/Chicago");
  const chicago = "Oct 20, 2026, 11:00 PM";
  assert.equal(localDateTime(utcPaidAt), chicago);
  assert.equal(formatDateTime(utcPaidAt), chicago);
  assert.equal(formatDateTime("2026-10-21T04:00:00Z"), chicago);
  assert.equal(formatDateTime("2026-10-21T04:00:00"), chicago);
  assert.equal(formatDateTime("2026-10-21T04:00:00.000"), chicago);
  assert.equal(formatDateTime("2026-10-21 04:00:00"), chicago);
  assert.equal(formatDateTime("2026-10-21T04:00:00+00:00"), chicago);
  assert.equal(formatDateTime("2026-10-21T04:00:00-05:00"), "Oct 21, 2026, 4:00 AM");
  assert.equal(formatDateTime("not-a-date"), "not-a-date");
});

test("formatRelative parses zone-less ISO timestamps as UTC", () => {
  assert.equal(formatRelative("2026-10-18T22:00:00.000Z"), "1h ago");
  assert.equal(formatRelative("2026-10-18T22:00:00"), "1h ago");
});
