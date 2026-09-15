type LogLevel = "info" | "warn" | "error";

const REDACT_KEYS = new Set(
  [
    "password",
    "token",
    "access_token",
    "refresh_token",
    "authorization",
    "cookie",
    "service_role",
    "servicerolekey",
    "supabase_service_role_key",
    "razorpay_key_secret",
    "razorpay_webhook_secret",
    "razorpay_signature",
    "x-razorpay-signature",
    "webhook_secret",
    "key_secret",
  ].map((key) => key.toLowerCase()),
);

function sanitize(value: unknown, key?: string): unknown {
  if (key && REDACT_KEYS.has(key.toLowerCase())) {
    return "[redacted]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitize(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function write(level: LogLevel, event: string, metadata?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(metadata ? { metadata: sanitize(metadata) } : {}),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export const logger = {
  info(event: string, metadata?: Record<string, unknown>) {
    write("info", event, metadata);
  },
  warn(event: string, metadata?: Record<string, unknown>) {
    write("warn", event, metadata);
  },
  error(event: string, metadata?: Record<string, unknown>) {
    write("error", event, metadata);
  },
};
