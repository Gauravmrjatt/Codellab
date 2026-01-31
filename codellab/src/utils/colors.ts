import type * as MonacoTypes from "monaco-editor"
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // keep int32
  }
  return Math.abs(hash)
}

export function getTextColorForBackground(lightness: number) {
  return lightness > 65 ? "#0f172a" : "#ffffff"
}

export  function getGradientForUser(userId: string) {
  const hash = hashString(userId)

  const baseHue = hash % 360
  const secondaryHue = (baseHue + 25 + (hash % 20)) % 360

  const saturation = 65
  const lightness1 = 56
  const lightness2 = 70

  const textColor = getTextColorForBackground(lightness2)

  return {
    caretColor: `hsl(${baseHue}, ${saturation}%, 52%)`,
    gradient: `linear-gradient(135deg,
      hsl(${baseHue}, ${saturation}%, ${lightness1}%),
      hsl(${secondaryHue}, ${saturation}%, ${lightness2}%)
    )`,
    textColor,
  }
}

export function ensureCursorStyle(userId: string, color: string) {
  const styleId = `remote-cursor-style-${userId}`
  if (document.getElementById(styleId)) return

  const style = document.createElement("style")
  style.id = styleId
  style.innerHTML = `
    .remote-cursor-${userId} {
      border-left: 3px solid ${color};
      margin-left: -1px;
      height: 1.25em;
      border-radius: 2px;
      pointer-events: none;
    }
  `
  document.head.appendChild(style)
}

export function createCursorWidget(
  username: string,
  userId: string
): MonacoTypes.editor.IContentWidget {
  const { gradient, textColor } = getGradientForUser(userId)

  const node = document.createElement("div")

  node.textContent = username
  node.style.background = gradient
  node.style.color = textColor
  node.style.padding = "4px 10px"
  node.style.borderRadius = "999px" // pill
  node.style.fontSize = "13px"
  node.style.fontWeight = "500"
  node.style.whiteSpace = "nowrap"
  node.style.pointerEvents = "none"

  // ✨ glassy look
  node.style.backdropFilter = "blur(8px)"
  node.style.backdropFilter = "blur(8px)"
  node.style.border = "2px solid rgba(255,255,255,0.25)"
  node.style.boxShadow =
    "0 6px 20px rgba(0,0,0,0.25)"

  // spacing above caret
  node.style.transform = "translateY(-30%) translateX(-50%)"

  return {
    getId: () => `cursor-label-${username}`,
    getDomNode: () => node,
    getPosition: () => null,
  }
}
