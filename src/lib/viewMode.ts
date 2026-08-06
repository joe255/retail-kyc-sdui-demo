export type ViewMode = 'reviewer' | 'customer'

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
}
