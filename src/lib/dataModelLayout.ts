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

const entityColumn: Record<string, number> = {
  PERSON: 0,
  ADDRESS: 0,
  NATIONALITY: 0,
  ALTERNATE_NAME: 0,
  IDENTITY_DOCUMENT: 0,
  IDENTITY_CHECK: 0,
  MISSING_DATA_ITEM: 0,
  WEALTH_EVIDENCE: 0,
  SCREENING_HIT: 0,
  PARTY: 1,
  CUSTOMER: 2,
  RELATED_PARTY: 2,
  BUSINESS_RELATIONSHIP: 3,
  CDD_CHECKLIST: 3,
  CDD_REVIEW: 3,
  CDD_DECISION: 3,
  EDD_FINDING: 3,
  RISK_RATING: 4,
}

function columnForNode(node: DataModelNode) {
  return entityColumn[node.entity] ?? (node.layer === 'identity' ? 0 : node.layer === 'party' ? 1 : node.layer === 'relationship' ? 3 : 4)
}

export function layoutDataModel(model: CustomerDataModel) {
  const columns = new Map<number, DataModelNode[]>()
  for (const node of model.nodes) {
    const column = columnForNode(node)
    columns.set(column, [...(columns.get(column) ?? []), node])
  }

  const emphasisOrder: Record<DataModelNode['emphasis'], number> = { primary: 0, connected: 1, supporting: 2 }
  for (const [column, nodes] of columns) columns.set(column, [...nodes].sort((left, right) => emphasisOrder[left.emphasis] - emphasisOrder[right.emphasis]))

  const columnHeights = new Map<number, number>()
  for (const [column, nodes] of columns) {
    const contentHeight = nodes.reduce((sum, node) => sum + estimateEntityNodeHeight(node), 0)
    columnHeights.set(column, contentHeight + Math.max(0, nodes.length - 1) * DATA_MODEL_NODE_GAP)
  }
  const layouts: DataModelNodeLayout[] = []
  for (const [column, nodes] of columns) {
    let y = 0
    for (const node of nodes) {
      const height = estimateEntityNodeHeight(node)
      layouts.push({ id: node.id, column, x: column * DATA_MODEL_COLUMN_GAP, y, width: ENTITY_NODE_WIDTH, height })
      y += height + DATA_MODEL_NODE_GAP
    }
  }
  return layouts
}
