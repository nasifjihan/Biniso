import { rateLimit } from "@/lib/rateLimit";
import { reportError } from "@/lib/monitoring";

// The browser cannot hold the webhook URL, so an error that happens in a client
// component is posted here and forwarded from the server.
const MAX_FIELD = 200;

const field = (value) => (value ? String(value).slice(0, MAX_FIELD) : undefined);

export async function POST(request) {
  const ip =
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Public endpoint that forwards to a webhook, so it is throttled per caller.
  const limited = rateLimit(`report:${ip}`, { limit: 20 });
  if (!limited.ok) return new Response(null, { status: 429 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    // An empty or malformed body is still worth a report, just a bare one.
    body = {};
  }

  await reportError(
    { message: body.message || "Client error", stack: body.stack },
    {
      source: "client",
      path: field(body.path),
      digest: field(body.digest),
      ip,
      userAgent: field(request.headers.get("user-agent")),
    },
  );

  return new Response(null, { status: 204 });
}
