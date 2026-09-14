"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Ship, RadioTower, Database, BellRing, Menu, X, ChevronDown, Github } from "lucide-react"
import { AnimatedText } from "@/components/animated-text"
import { DashboardPreview } from "@/components/dashboard-preview"
import { PACKET_META, PARAMETERS, PARAMETER_COUNT, SAMPLE_PACKET, SITES } from "@/lib/telemetry"
import type { TelemetryPacket } from "@/lib/telemetry"

function AnimatedCounter({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState("0")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        const targetNum = Number.parseFloat(value.replace(/[^0-9.]/g, ""))
        const unit = value.replace(/[0-9.]/g, "")

        let current = 0
        const increment = targetNum / 60
        interval = setInterval(() => {
          current += increment
          if (current >= targetNum) {
            setDisplayValue(`${targetNum}${unit}`)
            if (interval) clearInterval(interval)
          } else {
            setDisplayValue(`${current.toFixed(1)}${unit}`.replace(".0", ""))
          }
        }, 16)

        observer.disconnect()
      },
      { threshold: 0.5 },
    )

    if (ref.current) observer.observe(ref.current)

    return () => {
      observer.disconnect()
      if (interval) clearInterval(interval)
    }
  }, [value])

  return (
    <div className="text-8xl" ref={ref}>
      {displayValue}
    </div>
  )
}

/**
 * Nudges the reference packet by a fraction of a percent every few seconds so
 * the sample reads as a live feed. Drift is always measured from the base
 * sample rather than the previous value, so it never wanders off-range.
 */
function useLivePacket(): TelemetryPacket {
  const [packet, setPacket] = useState<TelemetryPacket>(SAMPLE_PACKET)

  useEffect(() => {
    const interval = setInterval(() => {
      setPacket((prev) => {
        const next: TelemetryPacket = { ...prev, ts: Number(prev.ts) + 5000 }
        for (const p of PARAMETERS) {
          const spread = Math.abs(p.sample) * 0.01 || 0.01
          const drift = (Math.random() - 0.5) * 2 * spread
          next[p.key] = Number((p.sample + drift).toFixed(p.decimals))
        }
        return next
      })
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return packet
}

function PacketViewer() {
  const packet = useLivePacket()

  const rows: Array<{ key: string; value: string; kind: "string" | "number" }> = [
    { key: "id", value: String(packet.id), kind: "string" },
    { key: "ts", value: String(packet.ts), kind: "number" },
    ...PARAMETERS.map((p) => ({
      key: p.key,
      value: Number(packet[p.key]).toFixed(p.decimals),
      kind: "number" as const,
    })),
  ]

  return (
    <div className="rounded-[20px] border border-white/10 bg-[#0F1117] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3]">
          Live packet — node {PACKET_META.id}
        </span>
      </div>
      <div className="p-5 md:p-6 font-mono text-[12px] md:text-[13px] leading-[1.85] overflow-x-auto">
        <div className="text-[#A7ABB3]">{"{"}</div>
        {rows.map((row, i) => (
          <div key={row.key} className="pl-5 whitespace-nowrap">
            <span className="text-sky-300">&quot;{row.key}&quot;</span>
            <span className="text-[#6B7280]">: </span>
            {row.kind === "string" ? (
              <span className="text-emerald-300">&quot;{row.value}&quot;</span>
            ) : (
              <span className="text-amber-300 tabular-nums">{row.value}</span>
            )}
            {i < rows.length - 1 && <span className="text-[#6B7280]">,</span>}
          </div>
        ))}
        <div className="text-[#A7ABB3]">{"}"}</div>
      </div>
    </div>
  )
}

export default function WqmPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [selectedFeature, setSelectedFeature] = useState(0)
  const [imageFade, setImageFade] = useState(true)
  const [autoRotationKey, setAutoRotationKey] = useState(0)
  const [dynamicWordIndex, setDynamicWordIndex] = useState(0)
  const [wordFade, setWordFade] = useState(true)
  const [dashboardScrollOffset, setDashboardScrollOffset] = useState(0)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const dynamicWords = ["the Beas", "the Uhl", "the Suketi", "every waypoint", "the Himalaya"]

  const navItems = [
    { id: "metrics", label: "System" },
    { id: "telemetry", label: "Telemetry" },
    { id: "architecture", label: "Architecture" },
    { id: "faq", label: "FAQ" },
    { id: "cta", label: "Dashboard" },
  ]

  const layers = [
    {
      title: "Edge Sensing Node",
      desc: "An STM32F722 aboard the boat samples twelve parameters, calibrates and median-filters on the edge, then serialises a compact JSON packet.",
      icon: Ship,
      image: "/rc-boat.webp",
    },
    {
      title: "LoRa Telemetry",
      desc: "SX1278 radios carry packets roughly 2 km line-of-sight to a shore gateway — no Wi-Fi or reliable cellular needed in the valley floor.",
      icon: RadioTower,
      image: "/lora-gateway.webp",
    },
    {
      title: "Supabase & Forecasting",
      desc: "An ESP8266 gateway backhauls over 4G into Postgres. An XGBoost classifier grades every reading, an Isolation Forest flags implausible ones, and Prophet projects the trend ahead.",
      icon: Database,
      image: "/analytics-desk.webp",
    },
    {
      title: "Dashboard & Alerts",
      desc: "Readings stream to the browser over a realtime subscription. Breaches are forwarded as SMS to local authorities through hardware the project already owns — no per-message billing.",
      icon: BellRing,
      image: "/sms-alert.webp",
    },
  ]

  const faqs = [
    {
      question: "What does the boat actually measure?",
      answer: `Twelve parameters per packet: pH, turbidity, total dissolved solids, dissolved oxygen, electrical conductivity, redox potential, water temperature (with a backup probe), water depth, and air temperature, humidity and barometric pressure. Each is calibrated and temperature-compensated on the node before transmission.`,
    },
    {
      question: "Why LoRa instead of Wi-Fi or cellular?",
      answer:
        "Deep river valleys in the Himalaya have little reliable Wi-Fi and patchy high-bandwidth cellular coverage. LoRa trades data rate for range — roughly 2 km line-of-sight, around 500 m in non-line-of-sight valley terrain — which is ample for a telemetry packet every few seconds. Only the shore gateway needs a cellular uplink.",
    },
    {
      question: "How is water quality actually graded?",
      answer:
        "Not by the textbook WQI formula — that needs BOD and COD, which are lab measurements taking three to five days. Instead an XGBoost classifier is trained to infer lab-grade quality from cheap sensor readings alone, sorting each one into Excellent, Good, Poor or Dangerous in under a millisecond. Anomaly detection runs in two layers on top: hard CPCB and BIS threshold rules that cannot fail, then an Isolation Forest that catches combinations which are individually normal but implausible together — an invisible solvent spill, for instance. Prophet forecasting is the next phase.",
    },
    {
      question: "What happens when a threshold is breached?",
      answer:
        "Threshold evaluation runs in the database as readings land, so it never depends on a browser being open. A breach raises an alert and fans out to the configured contacts, recording one delivery row per recipient so there is an audit trail of who was notified and when. Delivery uses hardware the project already owns rather than a paid gateway — see the next question.",
    },
    {
      question: "Why not use Twilio for the alerts?",
      answer:
        "Cost, and reach. Twilio bills per message — a recurring expense a student project cannot carry. But the replacement still has to arrive as SMS, because that is what municipal officials in India actually read; Telegram and WhatsApp are not realistic channels for a government recipient. Alerts are therefore forwarded as ordinary SMS by a MacroDroid rule running on a dedicated Android handset, triggered over a simple webhook. The gateway\u2019s own SIM7600E modem can send SMS directly as a fallback. Both use hardware and SIMs the project already pays for, so there is no added recurring cost.",
    },
    {
      question: "Is the boat autonomous?",
      answer:
        "In two stages. Stage 1 is a remote-controlled catamaran used as a mobile sensor platform. Stage 2 adds waypoint navigation: the boat holds position at each waypoint, waits for the water to settle, samples, then moves on. The hull is being developed in the mechanical repository.",
    },
    {
      question: "Where does the data live?",
      answer:
        "Supabase Postgres, with PostGIS for geospatial queries and Realtime for live delivery to the browser. Raw readings are immutable — the WQI is scored into a separate table so the formula can be revised and backfilled without ever touching the original sensor data.",
    },
  ]

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordFade(false)
      setTimeout(() => {
        setDynamicWordIndex((prev) => (prev + 1) % dynamicWords.length)
        setWordFade(true)
      }, 300)
    }, 3000)

    return () => clearInterval(wordInterval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)

      if (dashboardRef.current) {
        const dashboardRect = dashboardRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        const rotationStart = viewportHeight * 0.8
        const rotationEnd = viewportHeight * 0.2

        if (dashboardRect.top >= rotationStart) {
          setDashboardScrollOffset(0)
        } else if (dashboardRect.top <= rotationEnd) {
          setDashboardScrollOffset(15)
        } else {
          const scrollRange = rotationStart - rotationEnd
          const currentProgress = rotationStart - dashboardRect.top
          setDashboardScrollOffset((currentProgress / scrollRange) * 15)
        }
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsLoaded(true)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in")
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    )

    const elements = document.querySelectorAll(".animate-on-scroll")
    elements.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setImageFade(false)
      setTimeout(() => {
        setSelectedFeature((prev) => (prev + 1) % layers.length)
        setImageFade(true)
      }, 300)
    }, 6000)

    return () => clearInterval(interval)
  }, [autoRotationKey, layers.length])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setIsMenuOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-[#0B0C0F] text-[#F2F3F5] overflow-x-hidden">
      <header className="fixed top-6 left-6 md:w-auto md:right-auto right-6 z-40 border border-white/10 backdrop-blur-md bg-[#0B0C0F]/80 rounded-[16px]">
        <div className="w-full mx-auto px-6">
          <div className="flex items-center gap-6 md:h-14 h-14">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-lg md:text-xl font-semibold font-mono hover:text-sky-400 transition-colors duration-300"
            >
              WQM
            </button>

            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors duration-300"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden ml-auto p-2 hover:bg-white/5 rounded-lg transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-[#0B0C0F]/95 backdrop-blur-md z-50 flex flex-col items-start justify-end pb-20 pt-20 px-6">
          <div className="flex flex-col gap-8 items-start text-left w-full">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="font-serif text-5xl md:text-7xl font-light text-[#F2F3F5] hover:text-sky-400 transition-colors duration-300"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <section
        ref={heroRef}
        className={`relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isLoaded ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"}`}
        style={{
          backgroundImage: `url('/hero-landscape.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            backgroundImage: `url('/hero-landscape.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C0F] via-[#0B0C0F]/70 to-transparent pointer-events-none" />

        <div
          className="max-w-[1120px] w-full mx-auto relative z-10"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <div className="text-center mb-8 md:mb-12">
            <h1 className="font-serif text-[44px] leading-[1.1] md:text-[72px] md:leading-[1.05] font-medium mb-6 text-balance">
              <span
                className={`block stagger-reveal text-7xl font-light transition-all duration-500 md:text-8xl ${
                  wordFade ? "opacity-100 blur-0" : "opacity-0 blur-lg"
                }`}
              >
                Monitor <AnimatedText key={dynamicWordIndex} text={dynamicWords[dynamicWordIndex]} delay={0} />
              </span>
              <span className="block stagger-reveal text-7xl font-light md:text-8xl" style={{ animationDelay: "90ms" }}>
                in real time
              </span>
            </h1>
            <p
              className="text-[#A7ABB3] text-base md:text-lg max-w-[560px] mx-auto mb-8 leading-relaxed stagger-reveal text-white"
              style={{ animationDelay: "180ms" }}
            >
              A remote-controlled river boat streaming twelve water-quality parameters over LoRa — with 24-hour Water Quality
              Index forecasting and instant alerts to local authorities.
            </p>
            <div className="stagger-reveal" style={{ animationDelay: "270ms" }}>
              <Button
                onClick={() => scrollToSection("telemetry")}
                className="glass-button px-8 py-6 text-base rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-white"
              >
                See the live packet
              </Button>
            </div>
          </div>

          <div className="mt-12 md:mt-20 stagger-reveal" style={{ animationDelay: "360ms" }} ref={dashboardRef}>
            <div style={{ perspective: "1200px" }}>
              <div
                className="relative aspect-[16/10] md:aspect-[16/9] rounded-[24px] overflow-hidden"
                style={{
                  transform: `rotateX(${dashboardScrollOffset}deg)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.05s linear",
                }}
              >
                <div className="dashboard-image w-full h-full [container-type:inline-size]">
                  <DashboardPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-12 border-y border-white/5 bg-[#0B0C0F] overflow-hidden md:py-8 md:pt-8 md:pb-6">
        <div className="w-full">
          <p className="text-center text-xs md:text-sm uppercase tracking-[0.2em] text-[#A7ABB3] mb-8">
            Twelve parameters, sampled every ten minutes
          </p>
          <div className="logo-marquee">
            <div className="logo-marquee-content">
              {[...PARAMETERS, ...PARAMETERS].map((p, i) => (
                <div key={i} className="px-6 md:px-10 flex items-center gap-3 flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400/60" />
                  <span className="font-serif text-2xl md:text-3xl font-light whitespace-nowrap text-[#F2F3F5]/70">
                    {p.label}
                  </span>
                  {p.unit && <span className="font-mono text-xs text-[#A7ABB3] whitespace-nowrap">{p.unit}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="metrics" className="relative py-20 md:py-32 px-4 animate-on-scroll md:pt-24 md:pb-20">
        <div className="max-w-[1120px] w-full mx-auto">
          <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 md:mb-8 text-center text-balance">
            Engineered for{" "}
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #7dd3fc 0%, #e0f2fe 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              remote
            </span>{" "}
            river valleys
          </h2>

          <p className="text-[#A7ABB3] text-sm md:text-base mb-12 md:mb-16 text-center max-w-[620px] mx-auto leading-relaxed">
            Off-grid, solar-buffered and radio-linked. Built to keep reporting where there is no network to rely on.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-[800px] mx-auto">
            {[
              { label: "PARAMETERS PER PACKET", value: String(PARAMETER_COUNT), desc: "calibrated on the edge" },
              { label: "LORA RANGE", value: "2km", desc: "line-of-sight to gateway" },
              { label: "FORECAST HORIZON", value: "24h", desc: "LSTM-predicted WQI" },
              { label: "SAMPLE INTERVAL", value: "5s", desc: "default node cadence" },
            ].map((metric, i) => (
              <div
                key={i}
                className="p-6 md:p-10 text-center border border-white/10 border-t-0 border-b border-l-0 border-r-0 md:py-10 md:pb-20"
              >
                <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-4 flex items-center justify-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? "bg-sky-400/60" : "bg-emerald-400/60"}`} />
                  {metric.label}
                </div>
                <div className="font-serif text-[48px] md:text-[72px] leading-none font-medium">
                  <AnimatedCounter value={metric.value} />
                </div>
                <div className="text-[11px] md:text-xs text-[#A7ABB3] mt-3">{metric.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="telemetry" className="relative py-20 md:py-32 px-4 animate-on-scroll bg-[#0B0C0F]">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              THE DATA MODEL
            </div>
            <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
              One packet.{" "}
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(135deg, #7dd3fc 0%, #e0f2fe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Twelve
              </span>{" "}
              parameters.
            </h2>
            <p className="text-[#A7ABB3] text-sm md:text-base max-w-[620px] mx-auto leading-relaxed">
              This is the exact shape the node puts on the wire, and the exact shape that lands in Postgres. Every field
              below maps to one typed column — no schemaless drift, no silent corruption when firmware changes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="lg:sticky lg:top-28">
              <PacketViewer />
              <p className="text-xs text-[#A7ABB3] mt-4 leading-relaxed">
                <span className="font-mono text-sky-300">ts</span> is milliseconds since node boot, not epoch time. The
                ingestion endpoint assigns the authoritative timestamp on arrival and keeps the raw counter alongside it
                for clock-drift analysis.
              </p>
            </div>

            <div className="border border-white/10 rounded-[20px] overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3]">
                <div>Parameter / Postgres column</div>
                <div>Sensor</div>
              </div>
              {PARAMETERS.map((p) => (
                <div
                  key={p.key}
                  className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm md:text-base font-medium truncate">
                      {p.label}
                      {p.unit && <span className="text-[#A7ABB3] font-normal"> · {p.unit}</span>}
                    </div>
                    <div className="font-mono text-[11px] text-[#6B7280] truncate mt-0.5">
                      {p.key} → readings.{p.column}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-[#A7ABB3] whitespace-nowrap">{p.sensor}</div>
                    <div className="font-mono text-[11px] text-[#6B7280] whitespace-nowrap mt-0.5">{p.range}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            {SITES.map((site) => (
              <div key={site.river} className="border border-white/10 rounded-[16px] p-5 md:p-6">
                <div className="text-[10px] uppercase tracking-[0.15em] text-[#A7ABB3] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  Monitoring site
                </div>
                <div className="font-serif text-2xl md:text-3xl font-light mb-1">{site.river}</div>
                <div className="text-sm text-[#A7ABB3]">{site.reach}</div>
                <div className="font-mono text-[11px] text-[#6B7280] mt-3">
                  {site.district} · {site.lat.toFixed(2)}°N {site.lng.toFixed(2)}°E
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="architecture" className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="max-w-[720px] mb-12 md:mb-16">
              <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                SYSTEM ARCHITECTURE
              </div>
              <h2 className="font-serif text-[36px] leading-[1.15] md:text-[56px] md:leading-[1.1] font-medium mb-8 text-balance">
                From the riverbed to the{" "}
                <span
                  className="inline-block"
                  style={{
                    background: "linear-gradient(135deg, #7dd3fc 0%, #e0f2fe 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  dashboard
                </span>
              </h2>
              <p className="text-[#A7ABB3] text-base md:text-lg leading-relaxed">
                Four layers, each in its own repository. Manual sampling and lab analysis cannot catch a sudden pollution
                spike; this pipeline is built to close that gap in seconds rather than weeks.
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-stretch">
            <div>
              <div className="md:hidden mb-8">
                <div className="rounded-[24px] p-1 w-full aspect-[3/4] overflow-hidden">
                  <img
                    src={layers[selectedFeature].image || "/placeholder.svg"}
                    alt={layers[selectedFeature].title}
                    className={`w-full h-full object-cover rounded-[20px] transition-opacity duration-300 ${
                      imageFade ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {layers.map((layer, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setImageFade(false)
                      setTimeout(() => {
                        setSelectedFeature(i)
                        setImageFade(true)
                        setAutoRotationKey((prev) => prev + 1)
                      }, 300)
                    }}
                    className={`relative w-full text-left flex gap-4 items-start p-5 transition-all duration-300 rounded-xs py-4 overflow-hidden ${
                      selectedFeature === i ? "border border-white/20" : "border border-white/10"
                    }`}
                  >
                    <layer.icon
                      className={`w-6 h-6 flex-shrink-0 mt-1 transition-colors ${
                        selectedFeature === i ? "text-sky-400" : "text-sky-500/60"
                      }`}
                    />
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-medium mb-1">{layer.title}</h3>
                      <p className="text-sm md:text-base text-[#A7ABB3]">{layer.desc}</p>
                    </div>
                    {selectedFeature === i && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
                        <div className="h-full bg-white progress-bar" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-stretch justify-center">
              <div className="relative w-full h-full min-h-[420px]">
                {layers.map((layer, i) => {
                  const positionInStack = (i - selectedFeature + layers.length) % layers.length
                  const isActive = positionInStack === 0

                  return (
                    <div
                      key={i}
                      className="absolute inset-0 p-1 transition-all duration-600 ease-out"
                      style={{
                        zIndex: layers.length - positionInStack,
                        transform: `translateX(${positionInStack * 16}px) scale(${1 - positionInStack * 0.02})`,
                        opacity: isActive ? 1 : 0.6 - positionInStack * 0.15,
                      }}
                    >
                      <img
                        src={layer.image || "/placeholder.svg"}
                        alt={layer.title}
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="relative py-20 md:py-32 px-4 animate-on-scroll">
        <div className="max-w-[800px] w-full mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-[#A7ABB3] mb-6 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="font-serif text-[32px] leading-[1.15] md:text-[48px] md:leading-[1.1] font-medium mb-6 text-balance">
              Got{" "}
              <span
                className="inline-block"
                style={{
                  background: "linear-gradient(135deg, #7dd3fc 0%, #e0f2fe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                questions
              </span>
              ?
            </h2>
            <p className="text-[#A7ABB3] text-sm md:text-base max-w-[600px] mx-auto leading-relaxed">
              How the boat, the radio link and the forecasting pipeline actually fit together.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-base md:text-lg font-medium pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-[#A7ABB3] transition-transform duration-300 ${
                      openFaqIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-6 pb-6 text-sm md:text-base text-[#A7ABB3] leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="cta"
        className="relative py-24 md:py-40 px-4 animate-on-scroll overflow-hidden pt-0"
        style={{
          backgroundImage: `url('/earth-cta.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0F] via-[#0B0C0F]/60 to-transparent pointer-events-none" />
        <div className="max-w-[800px] w-full mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass-pill px-4 py-2 rounded-full mb-8 text-xs md:text-sm text-[#A7ABB3]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Currently in development
          </div>

          <h2 className="font-serif text-[40px] leading-[1.15] md:text-[64px] md:leading-[1.1] font-medium mb-6 text-balance">
            Bring the Himalayan rivers online
          </h2>
          <p className="text-[#A7ABB3] text-base md:text-lg mb-10 leading-relaxed max-w-[560px] mx-auto">
            Continuous, geotagged water quality data for the Beas, the Uhl and the Suketi — open, and built in the open.
          </p>

          <a href="https://github.com/WQM-Project" target="_blank" rel="noopener noreferrer">
            <Button className="glass-button text-base rounded-full bg-white/5 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 text-white px-8 py-6 md:text-base">
              Explore the project
            </Button>
          </a>
        </div>
      </section>

      <footer className="relative px-4 border-t border-white/5 py-8">
        <div className="max-w-[1120px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
            <div className="flex flex-col gap-4">
              <div className="text-lg font-semibold font-mono">WQM</div>
              <p className="text-xs text-[#A7ABB3] leading-relaxed">
                Real-time river water quality monitoring with pollution forecasting, for Himalayan river systems.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <a
                  href="https://github.com/WQM-Project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                  aria-label="GitHub organisation"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">This page</div>
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Repositories</div>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Edge sensing node", href: "https://github.com/WQM-Project/edge-sensing-node" },
                  { label: "Gateway", href: "https://github.com/WQM-Project/gateway" },
                  { label: "Water quality ML", href: "https://github.com/WQM-Project/water-quality-ml" },
                  { label: "Mechanical", href: "https://github.com/WQM-Project/wqm-mechanical" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.15em] text-[#F2F3F5] font-semibold mb-2">Project</div>
              <div className="flex flex-col gap-3">
                <a
                  href="https://github.com/WQM-Project/WQM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                >
                  Master specification
                </a>
                <a
                  href="https://github.com/WQM-Project/wqm-web-dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                >
                  Dashboard source
                </a>
                <a
                  href="https://github.com/WQM-Project/wqm-web-dashboard#database-schema"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                >
                  Database schema
                </a>
                <a
                  href="https://github.com/WQM-Project/wqm-web-dashboard#open-questions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#A7ABB3] hover:text-[#F2F3F5] transition-colors"
                >
                  Open questions
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#A7ABB3]">
            <div>© 2026 WQM-Project. Work in progress.</div>
            <div className="font-mono text-[11px] text-[#6B7280]">
              Beas · Uhl · Suketi — Himachal Pradesh, India
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
