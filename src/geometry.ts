/** Output frame and the centered square guide, in pixels. */
export const FRAME_W = 1280
export const FRAME_H = 670
export const GUIDE = 670

/** userScale is relative to a frame-covering fit. 1 means the image covers 1280×670. */
export const SCALE_MIN = 0.125
export const SCALE_MAX = 8

export interface View {
  userScale: number
  offsetX: number
  offsetY: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export function guideRect(): Rect {
  return {
    x: (FRAME_W - GUIDE) / 2,
    y: (FRAME_H - GUIDE) / 2,
    w: GUIDE,
    h: GUIDE,
  }
}

export function coverScale(naturalW: number, naturalH: number, boxW: number, boxH: number): number {
  return Math.max(boxW / naturalW, boxH / naturalH)
}

export function frameCoverView(): View {
  return { userScale: 1, offsetX: 0, offsetY: 0 }
}

/** Scale that covers the square guide. The guide shares the frame's center, so the offset stays 0. */
export function guideCoverView(naturalW: number, naturalH: number): View {
  const frame = coverScale(naturalW, naturalH, FRAME_W, FRAME_H)
  const guide = coverScale(naturalW, naturalH, GUIDE, GUIDE)
  return { userScale: guide / frame, offsetX: 0, offsetY: 0 }
}

export function imageRect(naturalW: number, naturalH: number, view: View): Rect {
  const scale = coverScale(naturalW, naturalH, FRAME_W, FRAME_H) * view.userScale
  const w = naturalW * scale
  const h = naturalH * scale
  return {
    x: FRAME_W / 2 - w / 2 + view.offsetX,
    y: FRAME_H / 2 - h / 2 + view.offsetY,
    w,
    h,
  }
}

export function clampScale(userScale: number): number {
  if (!Number.isFinite(userScale)) return 1
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, userScale))
}

/**
 * Zoom around a point in frame coordinates.
 * The image pixel under the cursor stays under the cursor.
 */
export function zoomAt(
  naturalW: number,
  naturalH: number,
  view: View,
  cursorX: number,
  cursorY: number,
  factor: number,
): View {
  const before = imageRect(naturalW, naturalH, view)
  const userScale = clampScale(view.userScale * factor)
  const u = before.w === 0 ? 0.5 : (cursorX - before.x) / before.w
  const v = before.h === 0 ? 0.5 : (cursorY - before.y) / before.h
  const grown = imageRect(naturalW, naturalH, { userScale, offsetX: 0, offsetY: 0 })
  return {
    userScale,
    offsetX: cursorX - u * grown.w - (FRAME_W / 2 - grown.w / 2),
    offsetY: cursorY - v * grown.h - (FRAME_H / 2 - grown.h / 2),
  }
}

export function scaleToSlider(userScale: number): number {
  const min = Math.log(SCALE_MIN)
  const max = Math.log(SCALE_MAX)
  const t = (Math.log(clampScale(userScale)) - min) / (max - min)
  return Math.round(Math.min(1, Math.max(0, t)) * 1000)
}

export function sliderToScale(slider: number): number {
  const min = Math.log(SCALE_MIN)
  const max = Math.log(SCALE_MAX)
  const t = Math.min(1, Math.max(0, slider / 1000))
  return Math.exp(min + t * (max - min))
}

/** How far the side color reaches at 90° when it stops on the guide edge. */
export const REACH_GUIDE = (FRAME_W - GUIDE) / 2

/** The two sides meet in the middle. Farther than this, the stops would cross. */
export const REACH_MAX = FRAME_W / 2

export function clampReach(px: number): number {
  if (!Number.isFinite(px)) return REACH_GUIDE
  return Math.min(REACH_MAX, Math.max(0, px))
}

/**
 * Where the pinch fades out, as fractions of the gradient line.
 * `reachPx` is the distance from each outer end. At 90° that distance is pixels
 * from the left and right edges, and REACH_GUIDE lands on the guide.
 */
export function pinchStops(reachPx: number = REACH_GUIDE): { start: number; end: number } {
  const reach = clampReach(reachPx) / FRAME_W
  return { start: reach, end: 1 - reach }
}

/** `#rrggbb` plus an alpha, for canvas stops and the matching CSS gradient. */
export function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  const a = Math.min(1, Math.max(0, alpha))
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Dial and CSS share this range. Rendering itself accepts any finite angle. */
export function normalizeDegrees(angle: number): number {
  if (!Number.isFinite(angle)) return 0
  return ((angle % 360) + 360) % 360
}

/**
 * Endpoints of a CSS linear-gradient line.
 * 0° points up and angles grow clockwise. colorA sits at the start, colorB at the end,
 * which is the same order as `linear-gradient(angle, colorA, colorB)`.
 * The line is long enough that a perpendicular through each corner of the box meets it,
 * matching the CSS Images spec (not merely the segment that hits the box edge).
 */
export function cssLinearGradientEnds(
  angleDeg: number,
  w: number,
  h: number,
): { x0: number; y0: number; x1: number; y1: number } {
  const rad = (angleDeg * Math.PI) / 180
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)
  const length = Math.abs(w * sin) + Math.abs(h * cos)
  const dx = (sin * length) / 2
  const dy = (-cos * length) / 2
  return {
    x0: w / 2 - dx,
    y0: h / 2 - dy,
    x1: w / 2 + dx,
    y1: h / 2 + dy,
  }
}
