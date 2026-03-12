"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Square } from "lucide-react"

interface PromptInputProps {
  onSubmit: (message: string) => void
  onStop?: () => void
  isStreaming?: boolean
  placeholder?: string
  disabled?: boolean
}

export function PromptInput({
  onSubmit,
  onStop,
  isStreaming = false,
  placeholder = "Type an instruction for this agent...",
  disabled = false,
}: PromptInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isStreaming) return
    onSubmit(trimmed)
    setValue("")
  }, [value, disabled, isStreaming, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus()
    }
  }, [isStreaming])

  return (
    <div className="flex items-end gap-2 rounded-lg border border-forge-border bg-card p-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isStreaming}
        className="min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
        rows={1}
      />
      {isStreaming ? (
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onStop}
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-forge-accent hover:bg-forge-accent/80"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
