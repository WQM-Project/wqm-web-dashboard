"use client"

import { PARAMETERS } from "@/lib/telemetry"

/**
 * A static preview of the operator dashboard, used as the hero mockup.
 *
 * Deliberately rendered as markup rather than a screenshot: it stays sharp at
 * any size, adapts to the theme, and — unlike an image — cannot drift out of
 * date as the real dashboard is built. All values are fixed sample readings,
 * not live data.
 */

/** 24 hours of WQI history, then 8 hours of forecast. Fixed, not random. */
const WQI_HISTORY = [
  62, 61, 63, 60, 58, 57, 59, 61, 64, 66, 63, 60, 57, 55, 54, 56, 58, 57, 55, 53, 52, 54, 56, 58,
]
const WQI_FORECAST = [58, 60, 63, 67, 71, 74, 76, 77]

const CHART_W = 560
const CHART_H = 130

function buildPath(values: number[], startIndex: number, total: number) {
  const min = 40
  const max = 90
  return values
    .map((v, i) => {
      const x = ((startIndex + i) / (total - 1)) * CHART_W
      const y = CHART_H - ((v - min) / (max - min)) * CHART_H
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

export function DashboardPreview() {
  const total = WQI_HISTORY.length + WQI_FORECAST.length
  const historyPath = buildPath(WQI_HISTORY, 0, total)
  const forecastPath = buildPath(
    [WQI_HISTORY[WQI_HISTORY.length - 1], ...WQI_FORECAST],
    WQI_HISTORY.length - 1,
    total,
  )

  const tiles = [
    { label: "Quality", value: "Good", sub: "XGBoost class", tone: "emerald" as const },
    { label: "pH", value: "7.12", sub: PARAMETERS[0].sensor, tone: "sky" as const },
    { label: "DO", value: "6.85", sub: "mg/L", tone: "sky" as const },
    { label: "Turbidity", value: "42.5", sub: "NTU", tone: "amber" as const },
    { label: "Battery", value: "3.9", sub: "V · node health", tone: "sky" as const },
  ]

  const toneText = {
    emerald: "text-emerald-400",
    sky: "text-sky-400",
    amber: "text-amber-400",
  }

  return (
    <div className="w-full h-full bg-[#0B0C0F] flex flex-col text-left select-none">
      {/* top bar */}
      <div className="flex items-center gap-3 px-[2.5%] py-[1.4%] border-b border-white/10 flex-shrink-0">
        <span className="font-mono text-[1.5cqw] font-semibold tracking-tight">WQM</span>
        <div className="hidden sm:flex items-center gap-[1.6cqw] text-[1.15cqw] text-[#A7ABB3]">
          <span className="text-[#F2F3F5]">Overview</span>
          <span>Map</span>
          <span>Nodes</span>
          <span>Alerts</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-[0.6cqw] h-[0.6cqw] min-w-[4px] min-h-[4px] rounded-full bg-emerald-400" />
          <span className="font-mono text-[1.1cqw] text-[#A7ABB3]">WQM-001 · Beas / Kullu</span>
        </div>
      </div>

      <div className="flex-1 px-[2.5%] py-[2%] flex flex-col gap-[2%] min-h-0">
        {/* metric tiles */}
        <div className="grid grid-cols-5 gap-[1.5%] flex-shrink-0">
          {tiles.map((tile) => (
            <div key={tile.label} className="border border-white/10 rounded-[0.8cqw] px-[4%] py-[5%]">
              <div className="text-[1cqw] uppercase tracking-[0.12em] text-[#A7ABB3] truncate">{tile.label}</div>
              <div className={`font-serif text-[2.6cqw] leading-tight font-medium truncate ${toneText[tile.tone]}`}>
                {tile.value}
              </div>
              <div className="text-[0.95cqw] text-[#6B7280] truncate">{tile.sub}</div>
            </div>
          ))}
        </div>

        {/* chart */}
        <div className="border border-white/10 rounded-[0.8cqw] p-[2%] flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-[1%] flex-shrink-0">
            <span className="text-[1cqw] uppercase tracking-[0.12em] text-[#A7ABB3]">
              Water Quality Index — 24 h history, 8 h forecast
            </span>
            <div className="flex items-center gap-[1.4cqw] text-[0.95cqw] text-[#6B7280]">
              <span className="flex items-center gap-1">
                <span className="w-[1.2cqw] h-[1px] bg-sky-400" /> observed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-[1.2cqw] h-[1px] border-t border-dashed border-amber-400" /> Prophet
              </span>
            </div>
          </div>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            className="w-full flex-1 min-h-0 overflow-visible"
          >
            <defs>
              <linearGradient id="wqiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1="0"
                x2={CHART_W}
                y1={CHART_H * f}
                y2={CHART_H * f}
                stroke="#ffffff"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
            ))}
            <path d={`${historyPath} L${CHART_W * ((WQI_HISTORY.length - 1) / (total - 1))},${CHART_H} L0,${CHART_H} Z`} fill="url(#wqiFill)" />
            <path d={historyPath} fill="none" stroke="#38bdf8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path
              d={forecastPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* alert strip */}
        <div className="border border-white/10 rounded-[0.8cqw] px-[2%] py-[1.4%] flex items-center gap-[2%] flex-shrink-0">
          <span className="w-[0.7cqw] h-[0.7cqw] min-w-[5px] min-h-[5px] rounded-full bg-amber-400 flex-shrink-0" />
          <span className="text-[1.1cqw] text-[#F2F3F5] truncate">
            Forecast WQI 77 in 8 h — approaching threshold
          </span>
          <span className="ml-auto font-mono text-[1cqw] text-[#6B7280] whitespace-nowrap">SMS queued · MacroDroid</span>
        </div>
      </div>
    </div>
  )
}
