"use client";

import { useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
  Heading2,
  Quote,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "./Textarea";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix?: string;
  block?: boolean;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: Bold, label: "Gras", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italique", prefix: "_", suffix: "_" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  { icon: Heading2, label: "Titre", prefix: "## ", block: true },
  { icon: Quote, label: "Citation", prefix: "> ", block: true },
  { icon: List, label: "Liste", prefix: "- ", block: true },
  { icon: ListOrdered, label: "Liste numerotee", prefix: "1. ", block: true },
  { icon: CheckSquare, label: "Checklist", prefix: "- [ ] ", block: true },
  { icon: Link, label: "Lien", prefix: "[", suffix: "](url)" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Ecrivez ici... (Markdown supporte)",
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = useCallback(
    (button: ToolbarButton) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      let newText: string;
      let newCursorPos: number;

      if (button.block) {
        // For block-level formatting, insert at start of line
        const beforeSelection = value.substring(0, start);
        const lastNewline = beforeSelection.lastIndexOf("\n");
        const lineStart = lastNewline + 1;

        newText =
          value.substring(0, lineStart) +
          button.prefix +
          value.substring(lineStart);
        newCursorPos = start + button.prefix.length;
      } else {
        // For inline formatting, wrap selection
        const suffix = button.suffix || button.prefix;
        newText =
          value.substring(0, start) +
          button.prefix +
          selectedText +
          suffix +
          value.substring(end);

        if (selectedText) {
          newCursorPos = end + button.prefix.length + suffix.length;
        } else {
          newCursorPos = start + button.prefix.length;
        }
      }

      onChange(newText);

      // Restore focus and cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange]
  );

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b bg-muted/30">
        {TOOLBAR_BUTTONS.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => insertFormatting(button)}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={button.label}
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Editor */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 rounded-t-none focus-visible:ring-0 resize-y"
        style={{ minHeight }}
      />

      {/* Help text */}
      <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/30">
        Markdown supporte: **gras**, _italique_, `code`, [lien](url)
      </div>
    </div>
  );
}
