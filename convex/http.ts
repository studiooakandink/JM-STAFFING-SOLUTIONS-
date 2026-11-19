import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

async function secretsMatch(
  expected: string,
  supplied: string,
): Promise<boolean> {
  const encoder = new TextEncoder();

  const expectedHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  );

  const suppliedHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
  );

  let difference = 0;

  for (let i = 0; i < expectedHash.length; i++) {
    difference |= expectedHash[i] ^ suppliedHash[i];
  }

  return difference === 0;
}

async function authorize(request: Request): Promise<Response | null> {
  const expectedSecret = process.env.ADMIN_API_SECRET;

  if (!expectedSecret) {
    return new Response("Service not configured.", { status: 503 });
  }

  const authorization = request.headers.get("Authorization") ?? "";
  const prefix = "Bearer ";

  if (!authorization.startsWith(prefix)) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const suppliedSecret = authorization.slice(prefix.length);

  if (
    !suppliedSecret ||
    !(await secretsMatch(expectedSecret, suppliedSecret))
  ) {
    return new Response("Unauthorized.", { status: 401 });
  }

  return null;
}

const noStore = { "Cache-Control": "no-store" };

http.route({
  path: "/admin/enquiries",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const denied = await authorize(request);
    if (denied) return denied;

    const enquiries = await ctx.runQuery(
      internal.admin.listForAdmin,
      {},
    );

    return Response.json(enquiries, { headers: noStore });
  }),
});

http.route({
  path: "/admin/sessions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const denied = await authorize(request);
    if (denied) return denied;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON.", { status: 400 });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("sessionId" in body) ||
      !("expiresAt" in body) ||
      !("csrfToken" in body)
    ) {
      return new Response("Invalid session data.", { status: 400 });
    }

    const { sessionId, expiresAt, csrfToken } = body as {
      sessionId: unknown;
      expiresAt: unknown;
      csrfToken: unknown;
    };

    if (
      typeof sessionId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(sessionId) ||
      typeof expiresAt !== "number" ||
      !Number.isSafeInteger(expiresAt) ||
      expiresAt <= Date.now() ||
      typeof csrfToken !== "string" ||
      csrfToken.length < 32 ||
      csrfToken.length > 256
    ) {
      return new Response("Invalid session data.", { status: 400 });
    }

    await ctx.runMutation(internal.admin.storeSession, {
      sessionId,
      expiresAt,
      csrfToken,
    });

    return Response.json({ ok: true }, { headers: noStore });
  }),
});

http.route({
  path: "/admin/sessions",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const denied = await authorize(request);
    if (denied) return denied;

    const sessionId = new URL(request.url).searchParams.get("sessionId");

    if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
      return new Response("Invalid session ID.", { status: 400 });
    }

    const session = await ctx.runQuery(
      internal.admin.getSession,
      { sessionId },
    );

    if (!session) {
      return new Response("Session not found.", {
        status: 404,
        headers: noStore,
      });
    }

    return Response.json(session, { headers: noStore });
  }),
});

http.route({
  path: "/admin/sessions",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const denied = await authorize(request);
    if (denied) return denied;

    const sessionId = new URL(request.url).searchParams.get("sessionId");

    if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
      return new Response("Invalid session ID.", { status: 400 });
    }

    const deleted = await ctx.runMutation(
      internal.admin.deleteSession,
      { sessionId },
    );

    return Response.json({ deleted }, { headers: noStore });
  }),
});

export default http;
