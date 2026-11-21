import {
  FRAME_H,
  FRAME_W,
  cssLinearGradientEnds,
  guideRect,
  imageRect,
  pinchStops,
  withAlpha,
  type View,
} from './geometry'

/** Opaque ground under the photo. The side colors fade out onto this, and onto the photo. */
export const FRAME_BASE = '#12110f'

export interface Drawable {
  source: CanvasImageSource
  width: number
  height: number
}

export interface Paint {
  mode: 'solid' | 'gradient'
  colorA: string
  colorB: string
  /**
   * Axis of the pinch, in CSS degrees. 0° is up and angles grow clockwise.
   * 90° pinches from the left (colorA) and the right (colorB).
   */
  angle: number
  /** 0–1 strength of the side colors. 1 means the outer edges are fully that color. */
  strength: number
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: Drawable | null,
  paint: Paint,
  view: View,
  maskToGuide: boolean,
): void {
  ctx.save()
  ctx.clearRect(0, 0, FRAME_W, FRAME_H)
  ctx.fillStyle = paint.mode === 'solid' ? paint.colorA : FRAME_BASE
  ctx.fillRect(0, 0, FRAME_W, FRAME_H)

  if (image) {
    const rect = imageRect(image.width, image.height, view)
    ctx.save()
    if (maskToGuide) {
      const guide = guideRect()
      ctx.beginPath()
      ctx.rect(guide.x, guide.y, guide.w, guide.h)
      ctx.clip()
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image.source, rect.x, rect.y, rect.w, rect.h)
    ctx.restore()
  }

  if (paint.mode === 'gradient' && paint.strength > 0 && Number.isFinite(paint.angle)) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, Math.max(0, paint.strength))
    fillSandwich(ctx, paint)
    ctx.restore()
  }

  ctx.restore()
}

/** Color at both outer ends, fading to clear across the centered guide. */
function fillSandwich(ctx: CanvasRenderingContext2D, paint: Paint): void {
  const { x0, y0, x1, y1 } = cssLinearGradientEnds(paint.angle, FRAME_W, FRAME_H)
  const { start, end } = pinchStops()
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  gradient.addColorStop(0, paint.colorA)
  gradient.addColorStop(start, withAlpha(paint.colorA, 0))
  gradient.addColorStop(end, withAlpha(paint.colorB, 0))
  gradient.addColorStop(1, paint.colorB)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, FRAME_W, FRAME_H)
}
