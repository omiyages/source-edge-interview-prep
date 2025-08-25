
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      // Use matchMedia result instead of measuring window.innerWidth
      // This prevents forced reflows by avoiding geometric property reads
      setIsMobile(mql.matches)
    }
    
    // Set initial value using matchMedia
    setIsMobile(mql.matches)
    
    // Use the newer API if available, fallback to older one
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    } else {
      // Fallback for older browsers
      mql.addListener(onChange)
      return () => mql.removeListener(onChange)
    }
  }, [])

  return !!isMobile
}
