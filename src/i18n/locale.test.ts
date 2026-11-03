import { describe, expect, it } from 'vitest'
import { RESOURCES } from './index'

describe('localization parity (zh-TW vs en)', () => {
  it('provides every data.* key in both locales', () => {
    const enKeys = Object.keys(RESOURCES.en).filter((k) => k.startsWith('data.'))
    expect(enKeys.length).toBeGreaterThan(0)
    for (const key of enKeys) {
      expect(RESOURCES['zh-TW'][key]).toBeTruthy()
    }
  })

  it('never exposes an unlocalized raw key for data labels', () => {
    const zhKeys = Object.keys(RESOURCES['zh-TW']).filter((k) => k.startsWith('data.'))
    for (const key of zhKeys) {
      expect(RESOURCES.en[key]).toBeTruthy()
    }
  })
})
