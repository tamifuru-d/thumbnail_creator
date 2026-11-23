import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_EXPORT_STEM, exportFileName } from '../src/filename.ts'
import { OLIVE_PRESET } from '../src/presets.ts'

test('a typed name is saved as a png', () => {
  assert.equal(exportFileName('note-olive'), 'note-olive.png')
  assert.equal(exportFileName('note-olive.png'), 'note-olive.png')
  assert.equal(exportFileName('  オリーブ  '), 'オリーブ.png')
})

test('an empty or unsafe name falls back to the default', () => {
  assert.equal(exportFileName(''), `${DEFAULT_EXPORT_STEM}.png`)
  assert.equal(exportFileName('   '), `${DEFAULT_EXPORT_STEM}.png`)
  assert.equal(exportFileName('../secret'), 'secret.png')
  assert.equal(exportFileName('a/b:c'), 'abc.png')
})

test('the olive preset uses the brand guide olive and deep olive', () => {
  assert.equal(OLIVE_PRESET.colorA, '#66722f')
  assert.equal(OLIVE_PRESET.colorB, '#3a4219')
  assert.equal(OLIVE_PRESET.mode, 'gradient')
  assert.equal(OLIVE_PRESET.strength, 0)
  assert.equal(OLIVE_PRESET.reach, 450)
  assert.equal(OLIVE_PRESET.angle, 135)
  assert.equal(OLIVE_PRESET.background, '#66722f')
})
