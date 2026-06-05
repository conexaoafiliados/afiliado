import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  onSubmit?: () => void;
  hideHint?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  onSubmit,
  hideHint,
}: MentionTextareaProps) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  const { data: suggestions = [] } = trpc.users.search.useQuery(
    { q: mentionQuery ?? "" },
    { enabled: !!mentionQuery && mentionQuery.length >= 1 }
  );

  useEffect(() => {
    setHighlight(0);
  }, [mentionQuery, suggestions.length]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    onChange(next);
    const cursor = e.target.selectionStart;
    const before = next.slice(0, cursor);
    const match = before.match(/@([a-zA-Z0-9_]*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function insertMention(username: string) {
    const el = ref.current;
    if (!el) return;
    const cursor = el.selectionStart;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const replaced = before.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `);
    onChange(replaced + after);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const pos = replaced.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !mentionQuery && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (!mentionQuery || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const user = suggestions[highlight];
      if (user?.username) insertMention(user.username);
    } else if (e.key === "Escape") {
      setMentionQuery(null);
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {mentionQuery !== null && suggestions.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-border bg-card shadow-lg max-h-40 overflow-auto">
          {suggestions.map((user, i) => (
            <li key={user.id}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                  i === highlight ? "bg-muted" : ""
                }`}
                onMouseDown={e => {
                  e.preventDefault();
                  if (user.username) insertMention(user.username);
                }}
              >
                <span className="font-medium">@{user.username}</span>
                {user.name && <span className="text-muted-foreground ml-2">{user.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!hideHint && (
        <p className="text-xs text-muted-foreground mt-1">Use @usuario para marcar alguém</p>
      )}
    </div>
  );
}
