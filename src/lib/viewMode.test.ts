import { describe, expect, it } from 'vitest'
import { viewModePolicy } from './viewMode'

describe('role-specific visibility policy', () => {
  it('gives reviewers the internal portfolio and diagnostic context', () => {
    expect(viewModePolicy.reviewer).toMatchObject({
      showPortfolio: true,
      showInternalCustomerMetadata: true,
      showInternalPanels: true,
      showPayloadControls: true,
    })
  })

  it('prevents customers from seeing other customers or internal decision context', () => {
    expect(viewModePolicy.customer).toMatchObject({
      showPortfolio: false,
      showInternalCustomerMetadata: false,
      showInternalPanels: false,
      showPayloadControls: false,
      showDemoControls: false,
    })
  })
})
