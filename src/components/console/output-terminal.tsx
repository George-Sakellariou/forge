"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal } from "lucide-react"

interface OutputTerminalProps {
  content: string
  title?: string
  maxHeight?: string
}

export function OutputTerminal({
  content,
  title = "Output",
  maxHeight = "400px",
}: OutputTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [content])

  return (
    <div className="glow-card flex flex-col overflow-hidden rounded-xl border border-forge-border bg-card">
      <div className="flex items-center justify-between border-b border-forge-border/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-muted-foreground/60" />
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 w-2 rounded-full bg-rose-500/40" />
          <div className="h-2 w-2 rounded-full bg-amber-500/40" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/40" />
        </div>
      </div>
      <ScrollArea style={{ maxHeight }}>
        <div className="p-4">
          {content ? (
            <pre className="terminal-output text-foreground/80">{content}</pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-xs text-muted-foreground/50">No output yet.</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
