import { createBffHandler } from "@/lib/server/bff";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handle = createBffHandler();
type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: Context): Promise<Response> {
  const { path } = await context.params;
  return handle(request, path);
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as DELETE,
  proxy as PATCH,
  proxy as OPTIONS,
  proxy as HEAD,
};
