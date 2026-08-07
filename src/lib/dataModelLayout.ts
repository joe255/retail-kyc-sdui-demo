import type { CustomerDataModel, DataModelNode } from '../types/sdui'

export const ENTITY_NODE_WIDTH = 286
export const DATA_MODEL_COLUMN_GAP = 500
export const DATA_MODEL_NODE_GAP = 92

export type DataModelNodeLayout = {
  id: string
  column: number
  x: number
  y: number
  width: number
  height: number
}

export function estimateEntityNodeHeight(node: DataModelNode) {
  const headerHeight = 100
  const fieldHeight = node.fields.reduce((total, field) => {
    const nameLines = Math.max(1, Math.ceil(field.name.length / 18))
    const valueLines = Math.max(1, Math.ceil(field.value.length / 22))
    return total + 18 + Math.max(nameLines, valueLines) * 16
  }, 0)
  return headerHeight + fieldHeight + 10
}

function columnForNode(node: DataModelNode, model: CustomerDataModel) {
  if (node.id === 'party') return 1
  if (node.id === 'customer') return 2
  if (node.id === 'risk-rating') return 4
  if (model.edges.some((relationship) => relationship.source === 'related-party' && relationship.target === node.id)) return 4
  const parent = model.edges.find((relationship) => relationship.target === node.id)?.source
  if (parent && model.edges.some((relationship) => relationship.source === 'related-party' && relationship.target === parent)) return 5
  if (model.edges.some((relationship) => relationship.source === 'party' && relationship.target === node.id)) return 0
  if (model.edges.some((relationship) => relationship.source === node.id && relationship.target === 'party')) return 0
  if (model.edges.some((relationship) => relationship.source === 'customer' && relationship.target === node.id)) return 3
  if (node.layer === 'identity') return 0
  if (node.layer === 'party') return 1
  if (node.layer === 'relationship') return 3
  return 4
}

export function layoutDataModel(model: CustomerDataModel) {
  const columns = new Map<number, DataModelNode[]>()
  for (const node of model.nodes) {
    const column = columnForNode(node, model)
    columns.set(column, [...(columns.get(column) ?? []), node])
  }

  const columnHeights = new Map<number, number>()
  for (const [column, nodes] of columns) {
    const contentHeight = nodes.reduce((sum, node) => sum + estimateEntityNodeHeight(node), 0)
    columnHeights.set(column, contentHeight + Math.max(0, nodes.length - 1) * DATA_MODEL_NODE_GAP)
  }
  const graphHeight = Math.max(...columnHeights.values(), 0)

  const layouts: DataModelNodeLayout[] = []
  for (const [column, nodes] of columns) {
    let y = (graphHeight - (columnHeights.get(column) ?? 0)) / 2
    for (const node of nodes) {
      const height = estimateEntityNodeHeight(node)
      layouts.push({ id: node.id, column, x: column * DATA_MODEL_COLUMN_GAP, y, width: ENTITY_NODE_WIDTH, height })
      y += height + DATA_MODEL_NODE_GAP
    }
  }
  return layouts
}
