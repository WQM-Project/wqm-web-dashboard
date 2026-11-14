"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

/**
 * A thin bar along the top of the window that starts the moment someone clicks
 * a link to another page on this site, and disappears once that page is shown.
 * It gives instant feedback before the server has answered.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const [busy, setBusy] = useState(false)

  // The new page has rendered.
  useEffect(() => setBusy(false), [pathname])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.("a")
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return
      const url = new URL(link.href, location.href)
      if (url.origin !== location.origin || url.pathname === location.pathname) return
      setBusy(true)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  return busy ? <div className="route-progress" role="progressbar" aria-label="Loading page" /> : null
}
