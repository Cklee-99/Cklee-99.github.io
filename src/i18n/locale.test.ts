import { describe, expect, it } from 'vitest'
import { RESOURCES } from './index'

const GROUPS = ['data.', 'strategy.', 'simulation.']

function keysFor(group: string, locale: 'zh-TW' | 'en'): string[] {
  return Object.keys(RESOURCES[locale]).filter((k) => k.startsWith(group))
}

describe('localization parity (zh-TW vs en)', () => {
  it('provides every key of each managed group in both locales', () => {
    for (const group of GROUPS) {
      const enKeys = keysFor(group, 'en')
      expect(enKeys.length).toBeGreaterThan(0)
      for (const key of enKeys) {
        expect(RESOURCES['zh-TW'][key]).toBeTruthy()
      }
    }
  })

  it('never exposes an unlocalized raw key for managed groups', () => {
    for (const group of GROUPS) {
      const zhKeys = keysFor(group, 'zh-TW')
      for (const key of zhKeys) {
        expect(RESOURCES.en[key]).toBeTruthy()
      }
    }
  })

  it('covers every strategy reason code used by the engine', () => {
    const reasonKeys = Object.keys(RESOURCES.en).filter((k) => k.startsWith('strategy.reason.'))
    expect(reasonKeys.length).toBeGreaterThan(0)
    for (const key of reasonKeys) {
      expect(RESOURCES['zh-TW'][key]).toBeTruthy()
    }
  })
})
