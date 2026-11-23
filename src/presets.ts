export interface PaintPreset {
  id: string
  label: string
  mode: 'gradient'
  colorA: string
  colorB: string
  angle: number
  strength: number
  reach: number
}

// ブランドガイド（TamifuruD）のオリーブベース。
// role-base olive #66722F、role-coord-dark olive-deep #3A4219。
// せり出し 305px は、90° でガイドの端に届く長さ。
export const OLIVE_PRESET: PaintPreset = {
  id: 'olive',
  label: 'オリーブ',
  mode: 'gradient',
  colorA: '#66722f',
  colorB: '#3a4219',
  angle: 90,
  strength: 1,
  reach: 305,
}
