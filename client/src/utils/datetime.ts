const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HAS_TIMEZONE_PATTERN = /([zZ]|[+-]\d{2}:\d{2})$/;

export const parseAppDate = (
  value: string | Date | null | undefined
): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed;

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    normalized = `${trimmed}T00:00:00`;
  } else if (!HAS_TIMEZONE_PATTERN.test(trimmed)) {
    normalized = trimmed.replace(' ', 'T');
    if (!normalized.includes('T')) {
      normalized = `${normalized}T00:00:00`;
    }
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getAppTimestamp = (
  value: string | Date | null | undefined
): number => parseAppDate(value)?.getTime() ?? 0;

export const formatLocalDate = (
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  const parsed = parseAppDate(value);
  return parsed ? parsed.toLocaleDateString(undefined, options) : '-';
};

export const formatLocalTime = (
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  const parsed = parseAppDate(value);
  return parsed
    ? parsed.toLocaleTimeString(undefined, {
        ...options,
        hour12: false,
      })
    : '-';
};

export const formatLocalDateTime = (
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  const parsed = parseAppDate(value);
  return parsed
    ? parsed.toLocaleString(undefined, {
        ...options,
        hour12: false,
      })
    : '-';
};
