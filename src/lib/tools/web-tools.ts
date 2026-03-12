import { registerTool, type ToolOutput } from "./tool-registry"

registerTool({
  name: "web_fetch",
  description:
    "Fetch the content of a URL. Returns the text content of the page. Useful for reading documentation, API responses, or web pages.",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: {
        type: "string",
        description: "The URL to fetch",
      },
      max_length: {
        type: "number",
        description: "Maximum content length to return (default 50000 chars)",
      },
    },
    required: ["url"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolOutput> {
    const url = input.url as string
    const maxLength = (input.max_length as number) || 50000

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Forge-Agent/1.0",
          Accept: "text/html,application/json,text/plain",
        },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        return {
          content: `HTTP ${response.status}: ${response.statusText}`,
          isError: true,
        }
      }

      let text = await response.text()
      if (text.length > maxLength) {
        text = text.slice(0, maxLength) + "\n... (content truncated)"
      }

      return { content: text }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { content: `Fetch error: ${message}`, isError: true }
    }
  },
})

registerTool({
  name: "web_search",
  description:
    "Search the web using a query. Returns search results with titles, URLs, and snippets. Useful for finding documentation, solutions, or current information.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
      max_results: {
        type: "number",
        description: "Maximum number of results (default 5)",
      },
    },
    required: ["query"],
  },
  async execute(input: Record<string, unknown>): Promise<ToolOutput> {
    const query = input.query as string
    const _maxResults = (input.max_results as number) || 5

    // For MVP, use a simple approach - can upgrade to Brave/Google API later
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        return {
          content: `Search failed: HTTP ${response.status}`,
          isError: true,
        }
      }

      const html = await response.text()
      // Extract basic results from DuckDuckGo HTML
      const results: string[] = []
      const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g
      let match
      while ((match = resultRegex.exec(html)) !== null && results.length < _maxResults) {
        const url = decodeURIComponent(match[1].replace(/.*uddg=/, "").split("&")[0])
        const title = match[2].replace(/<[^>]*>/g, "").trim()
        results.push(`${title}\n  ${url}`)
      }

      return {
        content: results.length > 0
          ? results.join("\n\n")
          : `No results found for: ${query}`,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { content: `Search error: ${message}`, isError: true }
    }
  },
})
