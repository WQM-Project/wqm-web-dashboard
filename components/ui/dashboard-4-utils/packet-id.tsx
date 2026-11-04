"use client";
import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

// Short form of the gateway-generated packet UUID, with the full value one click away.
export function PacketId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
    } catch {
      /* Clipboard blocked; the full UUID is still in the tooltip. */
    }
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
        UUID
      </span>
      <code title={id} className="font-mono">
        {id.slice(0, 8)}…
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Packet UUID copied" : "Copy full packet UUID"}
        className="rounded p-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      </button>
    </span>
  );
}
