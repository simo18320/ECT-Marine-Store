"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { sendAssistantMessage } from "@/lib/ai/service";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  known?: { fact: string; source: string }[];
  needsVerification?: string[];
}

export function AssistantChat({ yachts }: { yachts: { id: string; name: string }[] }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [yachtId, setYachtId] = useState<string>(yachts[0]?.id ?? "");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    startTransition(async () => {
      try {
        const result = await sendAssistantMessage(conversationId, trimmed, yachtId || null);
        setConversationId(result.conversationId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.reply, known: result.known, needsVerification: result.needsVerification },
        ]);
      } catch {
        setError("Something went wrong sending that message. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {yachts.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Ask about my yacht:
          <select
            value={yachtId}
            onChange={(e) => setYachtId(e.target.value)}
            className="rounded-md border border-input bg-card px-2 py-1"
          >
            <option value="">None (general question)</option>
            {yachts.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex min-h-72 flex-col gap-3 rounded-lg border border-border bg-card p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask about a product, a compatibility question, or (if you select a yacht above) when
            something on board is due for replacement. I only answer from what ECT has actually
            recorded — I&rsquo;ll say so plainly if I don&rsquo;t have verified information.
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "self-end text-right" : "self-start"}>
              <div
                className={
                  m.role === "user"
                    ? "inline-block rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "inline-block rounded-lg bg-secondary px-3 py-2 text-sm"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === "assistant" && m.needsVerification && m.needsVerification.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Not confirmed: {m.needsVerification.join("; ")}
                </p>
              )}
            </div>
          ))
        )}
        {isPending && <p className="text-sm text-muted-foreground">Thinking…</p>}
      </div>

      {error && <p className="text-sm text-status-critical">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. My water tastes odd, what should I check?"
          className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        Looking for a specific product?{" "}
        <Link href="/find-product" className="text-primary hover:underline">
          Use the product finder
        </Link>{" "}
        for a full ranked comparison instead.
      </p>
    </div>
  );
}
