export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MONITOR_URL = process.env.MONITOR_URL ?? "http://localhost:4000/events";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let upstream: Response;
      try {
        upstream = await fetch(MONITOR_URL, {
          headers: { Accept: "text/event-stream" },
          // @ts-expect-error - node fetch supports this
          duplex: "half",
        });
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "unavailable" })}\n\n`)
        );
        controller.close();
        return;
      }

      if (!upstream.ok || !upstream.body) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "unavailable" })}\n\n`)
        );
        controller.close();
        return;
      }

      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch {
        /* upstream closed */
      } finally {
        reader.cancel();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
