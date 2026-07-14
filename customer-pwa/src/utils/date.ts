import { format, formatDistanceToNow, isValid } from "date-fns";

export function formatDate(value: string): string {
  const date = new Date(value);
  return isValid(date) ? format(date, "d MMM yyyy") : "";
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return isValid(date) ? format(date, "d MMM yyyy, h:mm a") : "";
}

export function formatTime(value: string): string {
  const date = new Date(value);
  return isValid(date) ? format(date, "h:mm a") : "";
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  return isValid(date) ? `${formatDistanceToNow(date)} ago` : "";
}
