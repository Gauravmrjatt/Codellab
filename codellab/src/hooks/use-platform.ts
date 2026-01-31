// hooks/use-platform.ts
export function usePlatform() {
  if (typeof window === "undefined") return "mac"

  return /Mac|iPhone|iPad/.test(navigator.platform)
    ? "mac"
    : "windows"
}
