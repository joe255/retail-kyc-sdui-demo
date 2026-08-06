import type { ResponseState, SduiComponent, SduiScreen } from '../types/sdui'

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

export function missingRequiredFields(screen: SduiScreen, responses: ResponseState) {
  return screen.components.flatMap((component) => {
    if (!component.required || !isComponentVisible(component, responses)) return []
    const fieldId = componentFieldId(component)
    if (!fieldId) return []
    const value = componentValue(component, responses)
    return value === undefined || value === null || value === '' || value === false ? [fieldId] : []
  })
}
