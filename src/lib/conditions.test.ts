import { describe, expect, it } from 'vitest'
import { customers } from '../../server/data/customers'
import { isComponentVisible, isRequiredComponentComplete, missingRequiredFields } from './conditions'

const sofiaScreen = customers.find((customer) => customer.id === 'sofia-marin')!.screens[0]
const address = sofiaScreen.components.find((component) => component.id === 'sofia-new-address')!

describe('server-driven conditions', () => {
  it('reveals the address fields only when the customer has moved', () => {
    expect(isComponentVisible(address, {})).toBe(false)
    expect(isComponentVisible(address, { address_still_current: 'yes' })).toBe(false)
    expect(isComponentVisible(address, { address_still_current: 'no' })).toBe(true)
  })

  it('requires every visible address field after the customer selects moved', () => {
    expect(missingRequiredFields(sofiaScreen, {})).toEqual(['address_still_current'])
    expect(missingRequiredFields(sofiaScreen, { address_still_current: 'no' })).toEqual(['new_residential_address', 'new_address_evidence'])
    expect(missingRequiredFields(sofiaScreen, {
      address_still_current: 'no',
      new_residential_address: { country: 'NL', street: 'Keizersgracht', houseNumber: '100', postcode: '1015 AA', city: 'Amsterdam' },
      new_address_evidence: { name: 'proof.pdf' } as File,
    })).toEqual([])
  })

  it('enforces evidence presence and the backend-defined file-size limit', () => {
    const upload = customers.find((customer) => customer.id === 'lukas-weber')!.screens[0].components.find((component) => component.type === 'upload')!
    expect(isRequiredComponentComplete(upload, {})).toBe(false)
    expect(isRequiredComponentComplete(upload, { identity_document: { name: 'too-large.pdf', size: 11 * 1024 * 1024 } as File })).toBe(false)
    expect(isRequiredComponentComplete(upload, { identity_document: { name: 'passport.pdf', size: 2 * 1024 * 1024 } as File })).toBe(true)
  })

  it('does not treat backend defaults as an explicit customer answer', () => {
    const purposeScreen = customers.find((customer) => customer.id === 'jakob-stein')!.screens[1]
    expect(missingRequiredFields(purposeScreen, {})).toEqual(['relationship_purpose', 'expected_monthly'])
    expect(missingRequiredFields(purposeScreen, {
      relationship_purpose: 'salary_investment',
      expected_monthly: '5000_10000',
    })).toEqual([])
  })

  it('starts every actionable screen with at least one outstanding customer response', () => {
    for (const customer of customers.filter((candidate) => candidate.status === 'action_required')) {
      for (const screen of customer.screens) {
        expect(missingRequiredFields(screen, {}).length, `${customer.id}/${screen.id}`).toBeGreaterThan(0)
      }
    }
  })
})
