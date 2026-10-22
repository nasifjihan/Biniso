import { reportError } from "@/lib/monitoring";

/**
 * Next calls this for every uncaught server error — server actions, route
 * handlers and server renders included, none of which the React error boundary
 * ever sees.
 */
export async function onRequestError(error, request, context) {
  await reportError(error, {
    source: "server",
    path: request?.path,
    method: request?.method,
    route: context?.routePath,
    routerKind: context?.routerKind,
    routeType: context?.routeType,
  });
}
