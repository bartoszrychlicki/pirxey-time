// ─── Date formatting ─────────────────────────────────────────────────────────

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Time formatting ────────────────────────────────────────────────────────

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", { timeStyle: "short" }).format(date);
}

export function formatTimeString(time: string): string {
  // Already in HH:mm format — return as is
  return time;
}

// ─── Duration ────────────────────────────────────────────────────────────────

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function durationToString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}godz`;
  return `${hours}godz ${minutes}min`;
}

/**
 * Parse user-typed duration input into minutes.
 * Supports: "1:30", "1h30m", "1h", "90m", "90", "1.5h"
 */
export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // HH:mm format
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }

  // Xh Ym or XhYm format
  const hmMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*(?:h|godz)\s*(?:(\d+)\s*(?:m|min))?$/i,
  );
  if (hmMatch) {
    const hours = parseFloat(hmMatch[1]);
    const mins = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
    return Math.round(hours * 60 + mins);
  }

  // Xm or Xmin format
  const mMatch = trimmed.match(/^(\d+)\s*(?:m|min)$/i);
  if (mMatch) {
    return parseInt(mMatch[1], 10);
  }

  // Xh with decimal (e.g. "1.5h")
  const decimalHMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (decimalHMatch) {
    return Math.round(parseFloat(decimalHMatch[1]) * 60);
  }

  // Plain number → minutes
  const plainNumber = parseFloat(trimmed);
  if (!isNaN(plainNumber) && plainNumber >= 0) {
    return Math.round(plainNumber);
  }

  return null;
}

// ─── Date range ──────────────────────────────────────────────────────────────

export function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export function getDefaultTimes(): { startTime: string; endTime: string } {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const start = `${hours}:${minutes}`;

  const endDate = new Date(now.getTime() + 60 * 60 * 1000);
  const endHours = String(endDate.getHours()).padStart(2, "0");
  const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
  const end = `${endHours}:${endMinutes}`;

  return { startTime: start, endTime: end };
}

export function formatDateTimeLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

// ─── Time calculations ──────────────────────────────────────────────────────

export function calculateDurationMinutes(
  startTime: string,
  endTime: string,
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const diff = endMinutes - startMinutes;
  return diff > 0 ? diff : 0;
}
