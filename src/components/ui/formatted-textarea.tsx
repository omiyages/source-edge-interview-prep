import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormattedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showPreview?: boolean
}

const FormattedTextarea = React.forwardRef<HTMLTextAreaElement, FormattedTextareaProps>(
  ({ className, showPreview = false, value, ...props }, ref) => {
    const [isPreviewMode, setIsPreviewMode] = React.useState(false)

    const formatText = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold with **text**
        .replace(/\n/g, '<br />') // Line breaks
        .replace(/  /g, '&nbsp;&nbsp;') // Double spaces
    }

    return (
      <div className="space-y-2">
        {showPreview && (
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                !isPreviewMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewMode(true)}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                isPreviewMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Preview
            </button>
          </div>
        )}
        
        {isPreviewMode && showPreview ? (
          <div
            className={cn(
              "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm whitespace-pre-wrap",
              className
            )}
            dangerouslySetInnerHTML={{ __html: formatText(String(value || '')) }}
          />
        ) : (
          <textarea
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 whitespace-pre-wrap font-mono",
              className
            )}
            ref={ref}
            value={value}
            {...props}
          />
        )}
        
        {!isPreviewMode && (
          <p className="text-xs text-muted-foreground">
            Tip: Use **bold text** for bold formatting. Line breaks and spacing will be preserved.
          </p>
        )}
      </div>
    )
  }
)
FormattedTextarea.displayName = "FormattedTextarea"

export { FormattedTextarea }