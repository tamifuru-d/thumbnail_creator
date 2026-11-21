import {
  FRAME_H,
  FRAME_W,
  cssLinearGradientEnds,
  guideRect,
  imageRect,
  type View,
} from './geometry'

export interface Drawable {
  source: CanvasImageSource
  width: number
  height: number
}

export interface Paint {
  mode: 'solid' | 'gradient'
  colorA: string
  colorB: string
  /** CSS linear-gradient angle in degrees. 0° is up, clockwise. */
  angle: number
  overlay: boolean
  /** 0–1 opacity of the overlay. The background fill stays opaque. */
  overlayOpacity: number
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
  fillPaint(ctx, paint)

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

  if (paint.overlay && paint.overlayOpacity > 0) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, Math.max(0, paint.overlayOpacity))
    fillPaint(ctx, paint)
    ctx.restore()
  }

  ctx.restore()
}

function fillPaint(ctx: CanvasRenderingContext2D, paint: Paint): void {
  if (paint.mode === 'solid' || !Number.isFinite(paint.angle)) {
    ctx.fillStyle = paint.colorA
    ctx.fillRect(0, 0, FRAME_W, FRAME_H)
    return
  }
  const { x0, y0, x1, y1 } = cssLinearGradientEnds(paint.angle, FRAME_W, FRAME_H)
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
  gradient.addColorStop(0, paint.colorA)
  gradient.addColorStop(1, paint.colorB)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, FRAME_W, FRAME_H)
}
