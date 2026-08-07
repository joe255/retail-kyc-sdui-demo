import { describe, expect, it } from 'vitest'
import { customers } from '../../server/data/customers'
import { buildCustomerDataModel } from '../../server/data/dataModel'
import { DATA_MODEL_NODE_GAP, layoutDataModel, routeDataModelEdges } from './dataModelLayout'

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

  it('places every record of the same entity type in one vertical column', () => {
    for (const customer of customers) {
      const model = buildCustomerDataModel(customer)
      const layouts = new Map(layoutDataModel(model).map((node) => [node.id, node]))
      const columnsByEntity = new Map<string, Set<number>>()
      for (const node of model.nodes) {
        const columns = columnsByEntity.get(node.entity) ?? new Set<number>()
        columns.add(layouts.get(node.id)!.column)
        columnsByEntity.set(node.entity, columns)
      }
      expect([...columnsByEntity.values()].every((columns) => columns.size === 1), customer.id).toBe(true)
    }
  })

  it('assigns every relationship a unique lane within its routing corridor', () => {
    for (const customer of customers) {
      const lanes = routeDataModelEdges(buildCustomerDataModel(customer))
      const lanesByCorridor = new Map<string, number[]>()
      for (const lane of lanes) {
        expect(lane.laneFraction).toBeGreaterThan(0)
        expect(lane.laneFraction).toBeLessThan(1)
        lanesByCorridor.set(lane.corridor, [...(lanesByCorridor.get(lane.corridor) ?? []), lane.laneFraction])
      }
      for (const [corridor, fractions] of lanesByCorridor) {
        expect(new Set(fractions).size, `${customer.id}: duplicated lane in ${corridor}`).toBe(fractions.length)
      }
    }
  })
})
