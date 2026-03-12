export function createSSEStream(): {
  stream: ReadableStream
  send: (event: string, data: unknown) => void
  close: () => void
} {
  let controller: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(c) {
      controller = c
    },
    cancel() {
      controller = null
    },
  })

  function send(event: string, data: unknown): void {
    if (!controller) return
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      controller.enqueue(new TextEncoder().encode(payload))
    } catch {
      // Controller may have been closed
    }
  }

  function close(): void {
    if (!controller) return
    try {
      controller.close()
    } catch {
      // Already closed
    }
    controller = null
  }

  return { stream, send, close }
}

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
