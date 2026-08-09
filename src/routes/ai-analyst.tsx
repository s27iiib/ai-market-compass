import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/terminal/app-shell";
import { Chip, Panel, ShimmerLine } from "@/components/terminal/primitives";
import { aiService, type AnalystReply } from "@/services";
import aiLogo from "@/assets/ai-analyst.png";

export const Route = createFileRoute("/ai-analyst")({
  head: () => ({
    meta: [
      { title: "AI Analyst — Aurum AI Trading Intelligence" },
      {
        name: "description",
        content: "Ask the AI analyst about gold and FX setups, macro drivers, invalidation levels and position sizing.",
      },
      { property: "og:title", content: "AI Analyst — Aurum AI Trading Intelligence" },
      { property: "og:description", content: "Conversational market reasoning with explicit confidence and invalidation levels." },
    ],
  }),
  component: AIAnalyst,
});

type Msg = { id: string; role: "user" | "assistant"; text: string; reply?: AnalystReply };

const SUGGESTIONS = [
  "Why is gold rising today?",
  "Is this a good entry for XAU/USD?",
  "What is the biggest risk to this trade?",
  "What happens if US CPI comes in hot?",
  "Which pair has the strongest setup right now?",
];

function AIAnalyst() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "intro",
      role: "assistant",
      text: "I analyse gold and FX using structure, momentum, macro data, volatility and positioning. I always tell you what would invalidate my view, and I will tell you when there is no trade worth taking. Ask me anything about the current market.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: (q: string) => aiService.ask(q),
    onSuccess: (reply) =>
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: reply.answer, reply }]),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

  const submit = (q: string) => {
    const text = q.trim();
    if (!text || ask.isPending) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);
    setInput("");
    ask.mutate(text);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-3 sm:p-4 xl:p-6">
      <PageHeader
        eyebrow="Simulated reasoning engine"
        title="AI Analyst"
        description="Conversational access to the same intelligence layer that scores the markets. Answers include confidence and invalidation."
      />

      <Panel dense ai className="flex h-[calc(100vh-16rem)] min-h-[30rem] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end gap-2">
                <div className="max-w-[80%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {m.text}
                </div>
                <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  <User className="size-3.5" />
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <img
                  src={aiLogo}
                  alt="Aurum AI analyst"
                  className="mt-0.5 size-7 shrink-0 rounded-full border border-ai/30 object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{m.text}</p>
                  {m.reply && (
                    <div className="flex flex-wrap gap-1.5">
                      <Chip tone="ai">Confidence {m.reply.confidence}%</Chip>
                      {m.reply.tags.map((t) => (
                        <Chip key={t} tone="neutral">
                          {t}
                        </Chip>
                      ))}
                    </div>
                  )}
                  {m.reply?.invalidation && (
                    <p className="rounded-md border border-warn/25 bg-warn/8 px-3 py-2 text-[0.6875rem] text-warn">
                      Invalidation: {m.reply.invalidation}
                    </p>
                  )}
                </div>
              </div>
            ),
          )}

          {ask.isPending && (
            <div className="flex gap-3">
              <img src={aiLogo} alt="" className="mt-0.5 size-7 shrink-0 rounded-full border border-ai/30 object-cover" />
              <div className="flex-1 space-y-2 pt-1">
                <ShimmerLine label="Reading structure, macro and positioning…" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="rounded-full border border-border px-2.5 py-1 text-[0.6875rem] text-muted-foreground transition-colors hover:border-ai/40 hover:text-ai"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={2}
              placeholder="Ask about a setup, a macro driver, or your risk…"
              className="min-h-[3.25rem] resize-none text-sm"
            />
            <Button type="submit" size="icon" disabled={ask.isPending || !input.trim()} aria-label="Send message">
              <Send className="size-4" />
            </Button>
          </form>
          <p className="mt-2 text-[0.625rem] text-muted-foreground">
            Simulated analytical output for demonstration. Not investment advice.
          </p>
        </div>
      </Panel>
    </div>
  );
}
