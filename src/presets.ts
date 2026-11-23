export interface PaintPreset {
  id: string
  label: string
  mode: 'gradient'
  colorA: string
  colorB: string
  angle: number
  strength: number
  reach: number
  background: string
}

// ブランドガイド（TamifuruD）のオリーブベース。
// role-base olive #66722F、role-coord-dark olive-deep #3A4219。
// 背景は role-base のオリーブ。せり出し 450px、角度 135°、透過率 100%。
export const OLIVE_PRESET: PaintPreset = {
  id: 'olive',
  label: 'オリーブ',
  mode: 'gradient',
  colorA: '#66722f',
  colorB: '#3a4219',
  angle: 135,
  strength: 0,
  reach: 450,
  background: '#66722f',
}
