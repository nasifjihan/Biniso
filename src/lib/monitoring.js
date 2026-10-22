/**
 * The single place an unexpected error is reported from. It logs to the host's
 * console (which is where a small store actually reads its logs) and, when a
 * webhook is configured, forwards a short summary to it. Swapping this body for
 * Sentry later means no call site changes.
 */

const PREFIX = "[biniso:error]";
const MAX_MESSAGE = 500;
const MAX_STACK_LINES = 12;

const truncate = (value, max) => {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

/** Reduces anything thrown — an Error, a string, a rejected value — to fields. */
function describe(error) {
  if (!error || typeof error !== "object") {
    return { message: truncate(error ?? "Unknown error", MAX_MESSAGE) };
  }

  return {
    message: truncate(error.message || "Unknown error", MAX_MESSAGE),
    ...(error.stack
      ? {
          stack: String(error.stack)
            .split("\n")
            .slice(0, MAX_STACK_LINES)
            .join("\n"),
        }
      : {}),
    // React and Next attach this to errors that cross a server boundary.
    ...(error.digest ? { digest: String(error.digest) } : {}),
  };
}

/**
 * Slack reads `text`, Discord reads `content`. Sending both keys means either
 * endpoint accepts the report without a second code path.
 */
function webhookBody(report) {
  const details = Object.entries(report)
    .filter(([key, value]) => key !== "message" && key !== "stack" && value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const text = truncate(`${PREFIX} ${report.message}\n${details}`, 1800);

  return { text, content: text };
}

/**
 * Logs an error and forwards it when `ERROR_WEBHOOK_URL` is set. Reporting
 * never throws: failing to report must not become a second failure.
 */
export async function reportError(error, context = {}) {
  const report = { ...describe(error), ...context, at: new Date().toISOString() };

  console.error(`${PREFIX} ${report.message}`, report);

  const url = process.env.ERROR_WEBHOOK_URL;
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(webhookBody(report)),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
