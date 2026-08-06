import { describe, expect, it } from 'vitest'
import { customers } from '../../server/data/customers'
import { isComponentVisible, missingRequiredFields } from './conditions'

const sofiaScreen = customers.find((customer) => customer.id === 'sofia-marin')!.screens[0]
const street = sofiaScreen.components.find((component) => component.id === 'sofia-address-street')!

describe('server-driven conditions', () => {
  it('reveals the address fields only when the customer has moved', () => {
    expect(isComponentVisible(street, {})).toBe(false)
    expect(isComponentVisible(street, { address_still_current: 'yes' })).toBe(false)
    expect(isComponentVisible(street, { address_still_current: 'no' })).toBe(true)
  })

  it('requires every visible address field after the customer selects moved', () => {
    expect(missingRequiredFields(sofiaScreen, {})).toEqual(['address_still_current'])
    expect(missingRequiredFields(sofiaScreen, { address_still_current: 'no' })).toEqual([
      'new_address_country',
      'new_address_street',
      'new_address_house_number',
      'new_address_postcode',
      'new_address_city',
    ])
    expect(missingRequiredFields(sofiaScreen, {
      address_still_current: 'no',
      new_address_country: 'NL',
      new_address_street: 'Keizersgracht',
      new_address_house_number: '100',
      new_address_postcode: '1015 AA',
      new_address_city: 'Amsterdam',
    })).toEqual([])
  })
})
