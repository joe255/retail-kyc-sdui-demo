export type ViewMode = 'reviewer' | 'customer' | 'model' | 'metamodel'

export const viewModePolicy: Record<ViewMode, {
  label: string
  description: string
  showPortfolio: boolean
  showInternalCustomerMetadata: boolean
  showInternalPanels: boolean
  showPayloadControls: boolean
  showDemoControls: boolean
}> = {
  reviewer: {
    label: 'Reviewer',
    description: 'Internal case workspace',
    showPortfolio: true,
    showInternalCustomerMetadata: true,
    showInternalPanels: true,
    showPayloadControls: true,
    showDemoControls: true,
  },
  customer: {
    label: 'Customer',
    description: 'Reviewed person view',
    showPortfolio: false,
    showInternalCustomerMetadata: false,
    showInternalPanels: false,
    showPayloadControls: false,
    showDemoControls: false,
  },
  model: {
    label: 'Data model',
    description: 'Populated entity relationship view',
    showPortfolio: true,
    showInternalCustomerMetadata: true,
    showInternalPanels: false,
    showPayloadControls: true,
    showDemoControls: true,
  },
  metamodel: {
    label: 'Metamodel',
    description: 'Group-wide entity and handover view',
    showPortfolio: false,
    showInternalCustomerMetadata: false,
    showInternalPanels: false,
    showPayloadControls: true,
    showDemoControls: true,
  },
}
