export const DEFAULT_EXPORT_STEM = 'thumbnail-1280x670'

const INVALID = /[\\/:*?"<>|\u0000-\u001f]/g

export function exportFileName(raw: string): string {
  const stripped = raw
    .trim()
    .replace(INVALID, '')
    .replace(/\.png$/i, '')
    .trim()
    .replace(/^\.+/, '')
  const base = stripped || DEFAULT_EXPORT_STEM
  return `${base}.png`
}
