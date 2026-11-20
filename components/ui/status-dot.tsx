"use client";

// From 21st.dev "status-dot" (iconiq). Theme trimmed to the variables this
// component actually uses; behaviour and API are unchanged.
import { type CSSProperties, createElement, forwardRef, type HTMLAttributes, useLayoutEffect } from "react";

import { cn } from "@/lib/utils";

const componentThemeClassName =
  "[--ic-muted-foreground:#6d7480] [--ic-brand:#0ea5e9] [--ic-destructive:#dc2626] [--status-dot-neutral:var(--ic-muted-foreground)] [--status-dot-queued:#d1d5db] [--status-dot-canceled:#9ca3af] [--status-dot-active:var(--ic-brand)] [--status-dot-success:#14b8a6] [--status-dot-warning:#f59e0b] [--status-dot-error:var(--ic-destructive)] dark:[--ic-muted-foreground:#9a958a] dark:[--ic-brand:#38bdf8] dark:[--ic-destructive:#f87171] dark:[--status-dot-success:#2dd4bf] dark:[--status-dot-queued:#9ca3af] dark:[--status-dot-canceled:#6b7280]";

const STYLE_ID = "iconiq-status-dot-styles";
const RIPPLE_DURATION = 2.25;
const RIPPLE_DELAYS = [0, RIPPLE_DURATION / 2] as const;

const STATUS_DOT_CSS = `
@keyframes iconiq-status-dot-ripple {
  0% { box-shadow: 0 0 0 0 var(--status-dot-ripple-mid); }
  72% { box-shadow: 0 0 0 var(--status-dot-ripple-spread) var(--status-dot-ripple-end); }
  100% { box-shadow: 0 0 0 0 var(--status-dot-ripple-end); }
}
.iconiq-status-dot-ripple {
  --status-dot-ripple-mid: color-mix(in srgb, var(--status-dot-color) 48%, transparent);
  --status-dot-ripple-end: transparent;
  animation: iconiq-status-dot-ripple 2.25s ease-out infinite;
}
.dark .iconiq-status-dot-ripple {
  --status-dot-ripple-mid: color-mix(in srgb, var(--status-dot-color) 58%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .iconiq-status-dot-ripple { animation: none; }
}
`;

type StatusDotTone = "neutral" | "active" | "success" | "warning" | "error";
type StatusDotState = "QUEUED" | "BUILDING" | "ERROR" | "READY" | "CANCELED";
type StatusDotSize = "sm" | "md" | "lg";

const statusDotStates = ["QUEUED", "BUILDING", "ERROR", "READY", "CANCELED"] as const satisfies readonly StatusDotState[];
const statusDotTones = ["neutral", "active", "success", "warning", "error"] as const satisfies readonly StatusDotTone[];

const statusDotToneConfig = {
  neutral: { colorVar: "var(--status-dot-neutral)", label: "Neutral" },
  active: { colorVar: "var(--status-dot-active)", label: "Active" },
  success: { colorVar: "var(--status-dot-success)", label: "Success" },
  warning: { colorVar: "var(--status-dot-warning)", label: "Warning" },
  error: { colorVar: "var(--status-dot-error)", label: "Error" },
} as const satisfies Record<StatusDotTone, { colorVar: string; label: string }>;

const statusDotStateConfig = {
  QUEUED: { tone: "neutral", label: "Queued", animate: false, colorVar: "var(--status-dot-queued)" },
  BUILDING: { tone: "warning", label: "Building", animate: true },
  ERROR: { tone: "error", label: "Error", animate: false },
  READY: { tone: "success", label: "Ready", animate: false },
  CANCELED: { tone: "neutral", label: "Canceled", animate: false, colorVar: "var(--status-dot-canceled)" },
} as const satisfies Record<StatusDotState, { tone: StatusDotTone; label: string; animate: boolean; colorVar?: string }>;

const statusDotSizeConfig = {
  sm: { dot: 6, container: 14, rippleSpread: "7px" },
  md: { dot: 8, container: 20, rippleSpread: "9px" },
  lg: { dot: 10, container: 26, rippleSpread: "11px" },
} as const satisfies Record<StatusDotSize, { dot: number; container: number; rippleSpread: string }>;

type StatusDotBaseProps = {
  animate?: boolean;
  inline?: boolean;
  label?: string;
  labelClassName?: string;
  showLabel?: boolean;
  size?: StatusDotSize;
} & HTMLAttributes<HTMLElement>;

type StatusDotProps = StatusDotBaseProps &
  ({ state: StatusDotState; tone?: StatusDotTone } | { state?: StatusDotState; tone: StatusDotTone });

type ResolvedStatusDotConfig = { animate: boolean; colorVar: string; defaultLabel: string; tone: StatusDotTone };

function ensureStatusDotStyles() {
  if (typeof document === "undefined") return;
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = STATUS_DOT_CSS;
}

function getStatusDotConfig({ animate, state, tone }: { animate?: boolean; state?: StatusDotState; tone?: StatusDotTone }): ResolvedStatusDotConfig {
  if (state) {
    const stateEntry = statusDotStateConfig[state];
    const toneEntry = statusDotToneConfig[stateEntry.tone];
    return {
      animate: animate ?? stateEntry.animate,
      colorVar: "colorVar" in stateEntry ? stateEntry.colorVar : toneEntry.colorVar,
      defaultLabel: stateEntry.label,
      tone: stateEntry.tone,
    };
  }
  const resolvedTone = tone ?? "neutral";
  const toneEntry = statusDotToneConfig[resolvedTone];
  return { animate: animate ?? resolvedTone === "active", colorVar: toneEntry.colorVar, defaultLabel: toneEntry.label, tone: resolvedTone };
}

function resolveStatusDotAccessibleName(defaultLabel: string, label?: string) {
  return label && label.length > 0 ? label : defaultLabel;
}

function resolveStatusDotLabel({ defaultLabel, label, showLabel = false }: { defaultLabel: string; label?: string; showLabel?: boolean }) {
  const accessibleName = resolveStatusDotAccessibleName(defaultLabel, label);
  return { accessibleName, displayLabel: showLabel ? accessibleName : null };
}

function resolveStatusDotA11yProps({ accessibleName, showVisibleLabel }: { accessibleName: string; showVisibleLabel: boolean }) {
  if (showVisibleLabel) return { "aria-live": "polite" as const, role: "status" as const };
  return { "aria-label": accessibleName, "aria-live": "polite" as const, role: "status" as const };
}

function RippleRing({ delay, dotSize, rippleSpread }: { delay: number; dotSize: number; rippleSpread: string }) {
  return (
    <span
      aria-hidden
      className="iconiq-status-dot-ripple pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full motion-reduce:hidden"
      style={{ width: dotSize, height: dotSize, animationDelay: `${delay}s`, ["--status-dot-ripple-spread" as string]: rippleSpread }}
    />
  );
}

const StatusDot = forwardRef<HTMLElement, StatusDotProps>(function StatusDot(
  { animate, className, inline = true, label, labelClassName, showLabel = false, size = "md", state, style, tone, ...props },
  ref,
) {
  const config = getStatusDotConfig({ animate, state, tone });
  const sizeConfig = statusDotSizeConfig[size];
  const { accessibleName, displayLabel } = resolveStatusDotLabel({ defaultLabel: config.defaultLabel, label, showLabel });
  const a11yProps = resolveStatusDotA11yProps({ accessibleName, showVisibleLabel: Boolean(displayLabel) });
  const Root = inline ? "span" : "div";

  useLayoutEffect(() => {
    ensureStatusDotStyles();
  }, []);

  const colorStyle = { ["--status-dot-color" as string]: config.colorVar } as CSSProperties;

  return createElement(
    Root,
    {
      className: cn(componentThemeClassName, inline ? "inline-flex" : "flex", "items-center gap-2", className),
      ref,
      style: { ...style, ...colorStyle } as CSSProperties,
      ...props,
      ...a11yProps,
    },
    <span aria-hidden className="relative shrink-0 overflow-visible" style={{ width: sizeConfig.container, height: sizeConfig.container, ...colorStyle }}>
      {config.animate
        ? RIPPLE_DELAYS.map((delay) => <RippleRing delay={delay} dotSize={sizeConfig.dot} key={delay} rippleSpread={sizeConfig.rippleSpread} />)
        : null}
      <span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: sizeConfig.dot, height: sizeConfig.dot, backgroundColor: "var(--status-dot-color)" }}
      />
    </span>,
    displayLabel ? <span className={cn("text-sm font-medium text-[color:var(--ic-muted-foreground)]", labelClassName)}>{displayLabel}</span> : null,
  );
});

StatusDot.displayName = "StatusDot";

export {
  getStatusDotConfig,
  resolveStatusDotAccessibleName,
  resolveStatusDotA11yProps,
  resolveStatusDotLabel,
  StatusDot,
  statusDotSizeConfig,
  statusDotStateConfig,
  statusDotStates,
  statusDotToneConfig,
  statusDotTones,
};
export default StatusDot;
export type { ResolvedStatusDotConfig, StatusDotProps, StatusDotSize, StatusDotState, StatusDotTone };
