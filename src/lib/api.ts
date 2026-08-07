import type { CustomerListPayload, JourneyPayload, MetaModelPayload, ResponseState, SubmissionReceipt } from '../types/sdui'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const getCustomers = () => api<CustomerListPayload>('/api/v1/customers')

export const getJourney = (customerId: string) =>
  api<JourneyPayload>(`/api/v1/customers/${customerId}/journey`)

export const getMetaModel = () => api<MetaModelPayload>('/api/v1/metamodel')

export const submitScreen = (customerId: string, screenId: string, values: ResponseState) => {
  const serializableValues = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value instanceof File ? { name: value.name, size: value.size, type: value.type } : value,
    ]),
  )
  return api<SubmissionReceipt>(`/api/v1/customers/${customerId}/submissions`, {
    method: 'POST',
    body: JSON.stringify({ screenId, values: serializableValues }),
  })
}

export const resetDemo = () =>
  api<{ reset: true; resetAt: string }>('/api/v1/demo/reset', { method: 'POST', body: '{}' })
