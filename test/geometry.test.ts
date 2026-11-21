import assert from 'node:assert/strict'
import test from 'node:test'
import {
  FRAME_H,
  FRAME_W,
  GUIDE,
  cssLinearGradientEnds,
  frameCoverView,
  guideCoverView,
  guideRect,
  imageRect,
  normalizeDegrees,
  scaleToSlider,
  sliderToScale,
  zoomAt,
} from '../src/geometry.ts'

test('the guide is a 670 square centered in the 1280×670 frame', () => {
  assert.equal(FRAME_W, 1280)
  assert.equal(FRAME_H, 670)
  assert.equal(GUIDE, 670)
  assert.deepEqual(guideRect(), { x: 305, y: 0, w: 670, h: 670 })
})

test('frame cover places a square image so it covers the whole frame', () => {
  const rect = imageRect(1000, 1000, frameCoverView())
  assert.equal(rect.w, 1280)
  assert.equal(rect.h, 1280)
  assert.equal(rect.x, 0)
  assert.ok(rect.y < 0)
})

test('guide cover fits a square image exactly into the guide', () => {
  const rect = imageRect(1000, 1000, guideCoverView(1000, 1000))
  assert.equal(rect.w, 670)
  assert.equal(rect.h, 670)
  assert.equal(rect.x, 305)
  assert.equal(rect.y, 0)
})

test('guide cover fills the guide for a wide photo and stays centered', () => {
  const rect = imageRect(1920, 1080, guideCoverView(1920, 1080))
  assert.ok(Math.abs(rect.h - 670) < 1e-9)
  assert.ok(rect.x <= 305)
  assert.ok(rect.x + rect.w >= 305 + 670)
  assert.ok(Math.abs(rect.x + rect.w / 2 - FRAME_W / 2) < 1e-9)
})

test('zoom keeps the image pixel under the cursor', () => {
  const natural = { w: 1600, h: 1000 }
  const start = { userScale: 1, offsetX: 40, offsetY: -20 }
  const cursor = { x: 200, y: 400 }
  const before = imageRect(natural.w, natural.h, start)
  const u = (cursor.x - before.x) / before.w
  const v = (cursor.y - before.y) / before.h
  const next = zoomAt(natural.w, natural.h, start, cursor.x, cursor.y, 1.7)
  const after = imageRect(natural.w, natural.h, next)
  assert.ok(Math.abs(after.x + u * after.w - cursor.x) < 1e-6)
  assert.ok(Math.abs(after.y + v * after.h - cursor.y) < 1e-6)
  assert.ok(next.userScale > start.userScale)
})

test('zoom clamps at the scale limits', () => {
  const huge = zoomAt(100, 100, frameCoverView(), 0, 0, 1000)
  const tiny = zoomAt(100, 100, frameCoverView(), 0, 0, 0.0001)
  assert.equal(huge.userScale, 8)
  assert.equal(tiny.userScale, 0.125)
})

test('the scale slider is logarithmic and centered near a frame-covering fit', () => {
  assert.ok(Math.abs(sliderToScale(scaleToSlider(1)) - 1) < 0.02)
  assert.ok(sliderToScale(0) < sliderToScale(500))
  assert.ok(sliderToScale(500) < sliderToScale(1000))
})

test('degrees normalize to a clockwise dial', () => {
  assert.equal(normalizeDegrees(0), 0)
  assert.equal(normalizeDegrees(360), 0)
  assert.equal(normalizeDegrees(450), 90)
  assert.equal(normalizeDegrees(-90), 270)
  assert.equal(normalizeDegrees(Number.NaN), 0)
})

test('gradient endpoints follow CSS angles', () => {
  const right = cssLinearGradientEnds(90, 1280, 670)
  assert.ok(Math.abs(right.x0 - 0) < 1e-9)
  assert.ok(Math.abs(right.x1 - 1280) < 1e-9)
  assert.ok(Math.abs(right.y0 - 335) < 1e-9)
  assert.ok(Math.abs(right.y1 - 335) < 1e-9)

  const up = cssLinearGradientEnds(0, 1280, 670)
  assert.ok(Math.abs(up.y0 - 670) < 1e-9)
  assert.ok(Math.abs(up.y1 - 0) < 1e-9)
  assert.ok(Math.abs(up.x0 - 640) < 1e-9)

  const down = cssLinearGradientEnds(180, 200, 100)
  assert.ok(down.y1 > down.y0)

  const diag = cssLinearGradientEnds(45, 1280, 670)
  assert.ok(diag.x1 > diag.x0)
  assert.ok(diag.y1 < diag.y0)
})
