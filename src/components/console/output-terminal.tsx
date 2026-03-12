"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <div className="flex flex-col rounded-lg border border-forge-border bg-background">
      <div className="flex items-center justify-between border-b border-forge-border px-4 py-2">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-forge-error/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-forge-warning/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-forge-success/50" />
        </div>
      </div>
      <ScrollArea style={{ maxHeight }}>
        <div className="p-4">
          {content ? (
            <pre className="terminal-output text-foreground/80">{content}</pre>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No output yet.
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
