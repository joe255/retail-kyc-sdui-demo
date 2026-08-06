import type { ResponseState, SduiComponent, SduiScreen, StructuredAddressValue } from '../types/sdui'

export function isComponentVisible(component: SduiComponent, responses: ResponseState) {
  if (!component.visibleWhen?.length) return true
  return component.visibleWhen.every((condition) => {
    const matches = responses[condition.fieldId] === condition.value
    return condition.operator === 'equals' ? matches : !matches
  })
}

export function componentFieldId(component: SduiComponent): string | null {
  return 'fieldId' in component && typeof component.fieldId === 'string' ? component.fieldId : null
}

function componentValue(component: SduiComponent, responses: ResponseState) {
  const fieldId = componentFieldId(component)
  if (!fieldId) return undefined
  if (responses[fieldId] !== undefined) return responses[fieldId]
  return 'value' in component ? component.value : undefined
}

function structuredAddressComplete(value: unknown, requireRegion = false) {
  if (!value || typeof value !== 'object' || (typeof File !== 'undefined' && value instanceof File)) return false
  const address = value as Partial<StructuredAddressValue>
  const required = [address.country, address.street, address.houseNumber, address.postcode, address.city]
  if (requireRegion) required.push(address.region)
  return required.every((part) => typeof part === 'string' && part.trim().length > 0)
}

export function isRequiredComponentComplete(component: SduiComponent, responses: ResponseState) {
  if (!component.required) return true
  const value = componentValue(component, responses)
  if (component.type === 'structured_address') return structuredAddressComplete(value, component.requireRegion)
  if (component.type === 'upload') {
    if (!value || typeof value !== 'object') return false
    const size = 'size' in value && typeof value.size === 'number' ? value.size : 0
    return !component.maxSizeMb || size <= component.maxSizeMb * 1024 * 1024
  }
  return value !== undefined && value !== null && value !== '' && value !== false
}

export function missingRequiredFields(screen: SduiScreen, responses: ResponseState) {
  return screen.components.flatMap((component) => {
    if (component.type === 'profile_overview') {
      return component.sections.flatMap((section) => section.fields.flatMap((field) => {
        const fieldId = field.editComponent.fieldId
        if (responses[fieldId] === undefined) return []
        return isRequiredComponentComplete(field.editComponent, responses) ? [] : [fieldId]
      }))
    }
    if (!component.required || !isComponentVisible(component, responses)) return []
    const fieldId = componentFieldId(component)
    if (!fieldId) return []
    return isRequiredComponentComplete(component, responses) ? [] : [fieldId]
  })
}
