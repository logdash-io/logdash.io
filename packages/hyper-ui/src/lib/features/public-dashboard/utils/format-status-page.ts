const UTC_DATE = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const UTC_HOUR = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

export function formatUptime(uptime: number | null): string {
  if (uptime === null) return "No data";
  if (uptime >= 100) return "100%";
  return `${(Math.floor(uptime * 100 + 1e-6) / 100).toFixed(2)}%`;
}

export function formatUtcDate(timestamp: string): string {
  return UTC_DATE.format(new Date(timestamp));
}

export function formatUtcHour(timestamp: string): string {
  return UTC_HOUR.format(new Date(timestamp));
}

export function formatCount(count: number, noun: string): string {
  return `${count.toLocaleString("en")} ${noun}${count === 1 ? "" : "s"}`;
}

export function formatAge(from: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}
