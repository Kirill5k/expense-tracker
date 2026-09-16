export const dynamic = "force-dynamic";

/** Process liveness: deployment health checks must not depend on the core service. */
export function GET(): Response {
  return Response.json(
    { status: "ok" },
    {
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    },
  );
}
