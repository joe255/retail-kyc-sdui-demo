import { describe, expect, it } from 'vitest'
import { customers } from '../../server/data/customers'
import { buildCustomerDataModel } from '../../server/data/dataModel'
import { DATA_MODEL_NODE_GAP, layoutDataModel } from './dataModelLayout'

describe('data model graph layout', () => {
  it('packs every customer model without overlapping entity cards', () => {
    for (const customer of customers) {
      const layouts = layoutDataModel(buildCustomerDataModel(customer))
      for (const left of layouts) {
        for (const right of layouts) {
          if (left.id >= right.id || left.column !== right.column) continue
          const separated = left.y + left.height + DATA_MODEL_NODE_GAP <= right.y
            || right.y + right.height + DATA_MODEL_NODE_GAP <= left.y
          expect(separated, `${customer.id}: ${left.id} overlaps ${right.id}`).toBe(true)
        }
      }
    }
  })

  it('keeps Party between identity records and Customer', () => {
    const layouts = layoutDataModel(buildCustomerDataModel(customers[0]))
    const column = (id: string) => layouts.find((node) => node.id === id)!.column
    expect(column('person')).toBeLessThan(column('party'))
    expect(column('party')).toBeLessThan(column('customer'))
    expect(column('customer')).toBeLessThan(column('business-relationship'))
    expect(column('business-relationship')).toBeLessThan(column('risk-rating'))
  })
})
