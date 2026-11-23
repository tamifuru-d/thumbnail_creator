import { drawFrame, FRAME_BASE, type Paint } from './draw'
import { DEFAULT_EXPORT_STEM, exportFileName } from './filename'
import { OLIVE_PRESET } from './presets'
import {
  FRAME_H,
  FRAME_W,
  GUIDE,
  frameCoverView,
  guideCoverView,
  guideRect,
  normalizeDegrees,
  REACH_MAX,
  clampReach,
  pinchStops,
  scaleToSlider,
  sliderToScale,
  withAlpha,
  zoomAt,
  type View,
} from './geometry'

interface EditorState {
  bitmap: ImageBitmap | null
  width: number
  height: number
  fileName: string
  view: View
  maskToGuide: boolean
  mode: 'solid' | 'gradient'
  colorA: string
  colorB: string
  angle: number
  strength: number
  reach: number
  background: string
  imageOpacity: number
  saveName: string
}

const DEFAULT_PAINT = {
  mode: 'gradient' as const,
  colorA: '#1d4e89',
  colorB: '#1d4e89',
  angle: 135,
  strength: 0,
  reach: 450,
  background: FRAME_BASE,
  imageOpacity: 0.8,
}

const state: EditorState = {
  bitmap: null,
  width: 0,
  height: 0,
  fileName: '',
  view: frameCoverView(),
  maskToGuide: false,
  ...DEFAULT_PAINT,
  saveName: DEFAULT_EXPORT_STEM,
}

const view = document.querySelector<HTMLCanvasElement>('#view')!
const drop = document.querySelector<HTMLElement>('#drop')!
const guide = document.querySelector<HTMLElement>('#guide')!
const guideLabel = document.querySelector<HTMLElement>('#guide-label')!
const hint = document.querySelector<HTMLElement>('#hint')!
const frameMeta = document.querySelector<HTMLElement>('#frame-meta')!
const fileInput = document.querySelector<HTMLInputElement>('#file')!
const fileName = document.querySelector<HTMLElement>('#file-name')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear')!
const scaleInput = document.querySelector<HTMLInputElement>('#scale')!
const scaleReadout = document.querySelector<HTMLElement>('#scale-readout')!
const fitFrame = document.querySelector<HTMLButtonElement>('#fit-frame')!
const fitGuide = document.querySelector<HTMLButtonElement>('#fit-guide')!
const maskInput = document.querySelector<HTMLInputElement>('#mask')!
const modeInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="mode"]')]
const colorAInput = document.querySelector<HTMLInputElement>('#color-a')!
const colorBInput = document.querySelector<HTMLInputElement>('#color-b')!
const hexA = document.querySelector<HTMLInputElement>('#hex-a')!
const hexB = document.querySelector<HTMLInputElement>('#hex-b')!
const colorBField = document.querySelector<HTMLElement>('#color-b-field')!
const swapButton = document.querySelector<HTMLButtonElement>('#swap')!
const swatch = document.querySelector<HTMLElement>('#swatch')!
const angleBlock = document.querySelector<HTMLElement>('#angle-block')!
const dial = document.querySelector<HTMLElement>('#dial')!
const angleInput = document.querySelector<HTMLInputElement>('#angle')!
const reachInput = document.querySelector<HTMLInputElement>('#reach')!
const reachPxInput = document.querySelector<HTMLInputElement>('#reach-px')!
const reachReadout = document.querySelector<HTMLElement>('#reach-readout')!
const opacityInput = document.querySelector<HTMLInputElement>('#opacity')!
const opacityReadout = document.querySelector<HTMLElement>('#opacity-readout')!
const status = document.querySelector<HTMLElement>('#status')!
const imageOpacityInput = document.querySelector<HTMLInputElement>('#image-opacity')!
const imageOpacityReadout = document.querySelector<HTMLElement>('#image-opacity-readout')!
const backgroundInput = document.querySelector<HTMLInputElement>('#background')!
const hexBg = document.querySelector<HTMLInputElement>('#hex-bg')!
const presetBgOlive = document.querySelector<HTMLButtonElement>('#preset-bg-olive')!
const presetOlive = document.querySelector<HTMLButtonElement>('#preset-olive')!
const saveNameInput = document.querySelector<HTMLInputElement>('#save-name')!
const exportButton = document.querySelector<HTMLButtonElement>('#export')!
const resetButton = document.querySelector<HTMLButtonElement>('#reset')!

const HEX = /^#[0-9a-fA-F]{6}$/

frameMeta.textContent = `フレーム ${FRAME_W} × ${FRAME_H}　　ガイド ${GUIDE} × ${GUIDE}`
guideLabel.textContent = String(GUIDE)
document.querySelector<HTMLElement>('#mask-help')!.textContent =
  `オンにすると、${GUIDE}px の正方形の外側は塗りだけになります。`
placeGuide()

fileInput.addEventListener('click', () => {
  fileInput.value = ''
})

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (file) void loadFile(file)
})

clearButton.addEventListener('click', () => {
  clearImage()
  render()
})

scaleInput.addEventListener('input', () => {
  state.view.userScale = sliderToScale(Number(scaleInput.value))
  render({ skipScale: true })
})

fitFrame.addEventListener('click', () => {
  state.view = frameCoverView()
  render()
})

fitGuide.addEventListener('click', () => {
  if (!state.bitmap) return
  state.view = guideCoverView(state.width, state.height)
  render()
})

maskInput.addEventListener('change', () => {
  state.maskToGuide = maskInput.checked
  render()
})

for (const input of modeInputs) {
  input.addEventListener('change', () => {
    if (!input.checked) return
    state.mode = input.value === 'solid' ? 'solid' : 'gradient'
    render()
  })
}

colorAInput.addEventListener('input', () => setColor('A', colorAInput.value))
colorBInput.addEventListener('input', () => setColor('B', colorBInput.value))
hexA.addEventListener('input', () => setHex('A', hexA.value))
hexB.addEventListener('input', () => setHex('B', hexB.value))
hexA.addEventListener('blur', () => { hexA.value = state.colorA })
hexB.addEventListener('blur', () => { hexB.value = state.colorB })

swapButton.addEventListener('click', () => {
  const nextA = state.colorB
  state.colorB = state.colorA
  state.colorA = nextA
  render()
})

bindDial()

angleInput.addEventListener('input', () => {
  const value = Number(angleInput.value)
  if (!Number.isFinite(value)) return
  state.angle = value
  render({ skipAngle: true })
})
angleInput.addEventListener('blur', () => {
  if (!Number.isFinite(Number(angleInput.value))) state.angle = DEFAULT_PAINT.angle
  render()
})

reachInput.addEventListener('input', () => {
  state.reach = clampReach(Number(reachInput.value))
  reachPxInput.value = String(Math.round(state.reach))
  render({ skipReach: true })
})

reachPxInput.addEventListener('input', () => {
  const value = Number(reachPxInput.value)
  if (!Number.isFinite(value)) return
  state.reach = clampReach(value)
  reachInput.value = String(Math.round(state.reach))
  render({ skipReach: true })
})
reachPxInput.addEventListener('blur', () => {
  if (!Number.isFinite(Number(reachPxInput.value))) state.reach = DEFAULT_PAINT.reach
  render()
})

opacityInput.addEventListener('input', () => {
  state.strength = 1 - Number(opacityInput.value) / 100
  render({ skipOpacity: true })
})

imageOpacityInput.addEventListener('input', () => {
  state.imageOpacity = Number(imageOpacityInput.value) / 100
  render({ skipImageOpacity: true })
})

backgroundInput.addEventListener('input', () => setBackground(backgroundInput.value))
hexBg.addEventListener('input', () => {
  const next = hexBg.value.startsWith('#') ? hexBg.value : `#${hexBg.value}`
  if (!HEX.test(next)) return
  setBackground(next)
})
hexBg.addEventListener('blur', () => { hexBg.value = state.background })

presetBgOlive.addEventListener('click', () => {
  setBackground(OLIVE_PRESET.background)
})

presetOlive.addEventListener('click', () => {
  state.mode = OLIVE_PRESET.mode
  state.colorA = OLIVE_PRESET.colorA
  state.colorB = OLIVE_PRESET.colorB
  state.angle = OLIVE_PRESET.angle
  state.strength = OLIVE_PRESET.strength
  state.reach = OLIVE_PRESET.reach
  setBackground(OLIVE_PRESET.background)
})

saveNameInput.addEventListener('input', () => {
  state.saveName = saveNameInput.value
})

exportButton.addEventListener('click', exportPng)
resetButton.addEventListener('click', () => {
  clearImage()
  Object.assign(state, DEFAULT_PAINT)
  state.saveName = DEFAULT_EXPORT_STEM
  state.view = frameCoverView()
  state.maskToGuide = false
  setStatus('')
  render()
})

drop.addEventListener('click', () => {
  if (state.bitmap || panning) return
  fileInput.click()
})

drop.addEventListener('dragenter', (event) => {
  event.preventDefault()
  drop.classList.add('is-over')
})
drop.addEventListener('dragover', (event) => {
  event.preventDefault()
  drop.classList.add('is-over')
})
drop.addEventListener('dragleave', () => {
  drop.classList.remove('is-over')
})
drop.addEventListener('drop', (event) => {
  event.preventDefault()
  drop.classList.remove('is-over')
  const file = event.dataTransfer?.files?.[0]
  if (file) void loadFile(file)
})

window.addEventListener('dragover', (event) => event.preventDefault())
window.addEventListener('drop', (event) => event.preventDefault())

let panning = false
let lastPoint: { x: number; y: number } | null = null

drop.addEventListener('pointerdown', (event) => {
  if (!state.bitmap || event.button !== 0) return
  panning = true
  lastPoint = framePoint(event.clientX, event.clientY)
  drop.setPointerCapture(event.pointerId)
  drop.classList.add('is-panning')
})

drop.addEventListener('pointermove', (event) => {
  if (!panning || !lastPoint) return
  const point = framePoint(event.clientX, event.clientY)
  state.view.offsetX += point.x - lastPoint.x
  state.view.offsetY += point.y - lastPoint.y
  lastPoint = point
  render()
})

function endPan(event: PointerEvent) {
  if (!panning) return
  panning = false
  lastPoint = null
  drop.classList.remove('is-panning')
  if (drop.hasPointerCapture(event.pointerId)) drop.releasePointerCapture(event.pointerId)
}

drop.addEventListener('pointerup', endPan)
drop.addEventListener('pointercancel', endPan)

drop.addEventListener('wheel', (event) => {
  if (!state.bitmap) return
  event.preventDefault()
  const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08
  const point = framePoint(event.clientX, event.clientY)
  state.view = zoomAt(state.width, state.height, state.view, point.x, point.y, factor)
  render()
}, { passive: false })

window.addEventListener('keydown', (event) => {
  if (!state.bitmap) return
  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, textarea, button, [role="slider"]')) return
  const step = event.shiftKey ? 10 : 1
  if (event.key === 'ArrowLeft') state.view.offsetX -= step
  else if (event.key === 'ArrowRight') state.view.offsetX += step
  else if (event.key === 'ArrowUp') state.view.offsetY -= step
  else if (event.key === 'ArrowDown') state.view.offsetY += step
  else return
  event.preventDefault()
  render()
})

window.addEventListener('resize', () => render())

render()

async function loadFile(file: File) {
  setStatus('')
  try {
    const bitmap = await createImageBitmap(file)
    state.bitmap?.close()
    state.bitmap = bitmap
    state.width = bitmap.width
    state.height = bitmap.height
    state.fileName = file.name
    state.view = frameCoverView()
    render()
  } catch {
    setStatus('この画像は読み込めませんでした')
  }
}

function clearImage() {
  state.bitmap?.close()
  state.bitmap = null
  state.width = 0
  state.height = 0
  state.fileName = ''
  state.view = frameCoverView()
  fileInput.value = ''
}

function setColor(which: 'A' | 'B', value: string) {
  if (!HEX.test(value)) return
  if (which === 'A') state.colorA = value.toLowerCase()
  else state.colorB = value.toLowerCase()
  render()
}

function setBackground(value: string) {
  if (!HEX.test(value)) return
  state.background = value.toLowerCase()
  render()
}

function setHex(which: 'A' | 'B', value: string) {
  const next = value.startsWith('#') ? value : `#${value}`
  if (!HEX.test(next)) return
  setColor(which, next)
}

function bindDial() {
  let dragging = false

  function setFromPointer(event: PointerEvent) {
    const rect = dial.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    state.angle = Math.round(normalizeDegrees((Math.atan2(dx, -dy) * 180) / Math.PI))
    render()
  }

  dial.addEventListener('pointerdown', (event) => {
    if (state.mode !== 'gradient') return
    dragging = true
    dial.setPointerCapture(event.pointerId)
    setFromPointer(event)
  })
  dial.addEventListener('pointermove', (event) => {
    if (!dragging) return
    setFromPointer(event)
  })
  const stop = (event: PointerEvent) => {
    dragging = false
    if (dial.hasPointerCapture(event.pointerId)) dial.releasePointerCapture(event.pointerId)
  }
  dial.addEventListener('pointerup', stop)
  dial.addEventListener('pointercancel', stop)

  dial.addEventListener('keydown', (event) => {
    if (state.mode !== 'gradient') return
    const step = event.shiftKey ? 15 : 1
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') state.angle = normalizeDegrees(state.angle + step)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') state.angle = normalizeDegrees(state.angle - step)
    else return
    event.preventDefault()
    render()
  })
}

function paint(): Paint {
  return {
    mode: state.mode,
    colorA: state.colorA,
    colorB: state.colorB,
    angle: state.angle,
    strength: state.strength,
    reach: state.reach,
    background: state.background,
    imageOpacity: state.imageOpacity,
  }
}

function render(flags: { skipScale?: boolean; skipAngle?: boolean; skipReach?: boolean; skipOpacity?: boolean; skipImageOpacity?: boolean } = {}) {
  const canvas = view
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const width = Math.round(FRAME_W * dpr)
  const height = Math.round(FRAME_H * dpr)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const image = state.bitmap
    ? { source: state.bitmap, width: state.width, height: state.height }
    : null
  drawFrame(ctx, image, paint(), state.view, state.maskToGuide)

  const hasImage = state.bitmap !== null
  drop.classList.toggle('has-image', hasImage)
  hint.classList.toggle('is-hidden', hasImage)
  guide.classList.toggle('is-mask', state.maskToGuide)
  fileName.textContent = state.fileName || '未選択'
  clearButton.disabled = !hasImage
  scaleInput.disabled = !hasImage
  fitFrame.disabled = !hasImage
  fitGuide.disabled = !hasImage
  if (!flags.skipScale) scaleInput.value = String(scaleToSlider(state.view.userScale))
  scaleReadout.textContent = formatPercent(state.view.userScale)

  for (const input of modeInputs) input.checked = input.value === state.mode
  colorAInput.value = state.colorA
  colorBInput.value = state.colorB
  if (document.activeElement !== hexA) hexA.value = state.colorA
  if (document.activeElement !== hexB) hexB.value = state.colorB

  const gradient = state.mode === 'gradient'
  colorBField.classList.toggle('is-inactive', !gradient)
  colorBInput.disabled = !gradient
  hexB.disabled = !gradient
  angleBlock.classList.toggle('is-inactive', !gradient)
  angleInput.disabled = !gradient
  dial.classList.toggle('is-disabled', !gradient)
  dial.tabIndex = gradient ? 0 : -1
  dial.setAttribute('aria-disabled', gradient ? 'false' : 'true')
  const shownAngle = Math.round(normalizeDegrees(state.angle))
  dial.style.setProperty('--angle', `${shownAngle}deg`)
  dial.setAttribute('aria-valuenow', String(shownAngle))
  if (!flags.skipAngle && document.activeElement !== angleInput) {
    angleInput.value = Number.isInteger(state.angle) ? String(state.angle) : String(Math.round(state.angle * 100) / 100)
  }

  const { start, end } = pinchStops(state.reach)
  const edge = gradient ? state.strength : 1
  swatch.style.backgroundColor = gradient ? state.background : state.colorA
  swatch.style.backgroundImage = gradient
    ? `linear-gradient(${state.angle}deg, ${withAlpha(state.colorA, edge)} 0%, ${withAlpha(state.colorA, 0)} ${start * 100}%, ${withAlpha(state.colorB, 0)} ${end * 100}%, ${withAlpha(state.colorB, edge)} 100%)`
    : 'none'

  maskInput.checked = state.maskToGuide
  reachInput.disabled = !gradient
  reachPxInput.disabled = !gradient
  reachInput.max = String(REACH_MAX)
  reachPxInput.max = String(REACH_MAX)
  const shownReach = Math.round(state.reach)
  if (!flags.skipReach) {
    reachInput.value = String(shownReach)
    if (document.activeElement !== reachPxInput) reachPxInput.value = String(shownReach)
  }
  reachReadout.textContent = `${shownReach}px`

  opacityInput.disabled = !gradient
  if (!flags.skipOpacity) opacityInput.value = String(Math.round((1 - state.strength) * 100))
  opacityReadout.textContent = `${Math.round((1 - state.strength) * 100)}%`

  if (!flags.skipImageOpacity) imageOpacityInput.value = String(Math.round(state.imageOpacity * 100))
  imageOpacityReadout.textContent = `${Math.round(state.imageOpacity * 100)}%`
  backgroundInput.value = state.background
  if (document.activeElement !== hexBg) hexBg.value = state.background
  const bgOlive = state.background === OLIVE_PRESET.background
  presetBgOlive.classList.toggle('is-selected', bgOlive)
  presetBgOlive.setAttribute('aria-pressed', bgOlive ? 'true' : 'false')

  const olive =
    state.mode === OLIVE_PRESET.mode &&
    state.colorA === OLIVE_PRESET.colorA &&
    state.colorB === OLIVE_PRESET.colorB
  presetOlive.classList.toggle('is-selected', olive)
  presetOlive.setAttribute('aria-pressed', olive ? 'true' : 'false')
  if (document.activeElement !== saveNameInput) saveNameInput.value = state.saveName
}

function exportPng() {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_W
  canvas.height = FRAME_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const image = state.bitmap
    ? { source: state.bitmap, width: state.width, height: state.height }
    : null
  drawFrame(ctx, image, paint(), state.view, state.maskToGuide)
  canvas.toBlob((blob) => {
    if (!blob) {
      setStatus('書き出せませんでした')
      return
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportFileName(state.saveName)
    link.click()
    URL.revokeObjectURL(url)
    setStatus('')
  }, 'image/png')
}

function placeGuide() {
  const rect = guideRect()
  guide.style.left = `${(rect.x / FRAME_W) * 100}%`
  guide.style.top = `${(rect.y / FRAME_H) * 100}%`
  guide.style.width = `${(rect.w / FRAME_W) * 100}%`
  guide.style.height = `${(rect.h / FRAME_H) * 100}%`
}

function framePoint(clientX: number, clientY: number): { x: number; y: number } {
  const rect = view.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * FRAME_W,
    y: ((clientY - rect.top) / rect.height) * FRAME_H,
  }
}

function formatPercent(userScale: number): string {
  const pct = userScale * 100
  return `${Math.round(pct)}%`
}

function setStatus(message: string) {
  status.textContent = message
}
