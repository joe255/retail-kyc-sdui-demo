import { useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { Boxes, GitBranch, KeyRound, Layers3 } from 'lucide-react'
import type { MetaModelDomainId, MetaModelEntity, MetaModelPayload } from '../types/sdui'

const GROUP_WIDTH = 410
const GROUP_GAP = 110
const GROUP_TOP = 110
const ENTITY_WIDTH = 286
const ENTITY_HEIGHT = 96
const ENTITY_GAP = 22

const domainStyle: Record<MetaModelDomainId, { color: string; bar: string; badge: string; surface: string; border: string }> = {
  party: { color: '#8b5cf6', bar: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 ring-violet-200', surface: 'bg-violet-50/45', border: 'border-violet-200/80' },
  identity: { color: '#06b6d4', bar: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200', surface: 'bg-cyan-50/45', border: 'border-cyan-200/80' },
  relationship: { color: '#10b981', bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', surface: 'bg-emerald-50/45', border: 'border-emerald-200/80' },
  assurance: { color: '#f59e0b', bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 ring-amber-200', surface: 'bg-amber-50/45', border: 'border-amber-200/80' },
}

type MetaPort = {
  id: string
  type: 'source' | 'target'
  position: 'left' | 'right'
  top: number
}

type DomainNodeData = {
  label: string
  description: string
  domain: MetaModelDomainId
  count: number
} & Record<string, unknown>

type EntityNodeData = {
  entity: MetaModelEntity
  ports: MetaPort[]
} & Record<string, unknown>

type MetaEdgeData = {
  label: string
  route: 'corridor' | 'local' | 'upper'
  laneFraction: number
  laneOffset: number
} & Record<string, unknown>

type DomainFlowNode = Node<DomainNodeData, 'domain'>
type EntityFlowNode = Node<EntityNodeData, 'metaEntity'>
type MetaFlowNode = DomainFlowNode | EntityFlowNode
type MetaFlowEdge = Edge<MetaEdgeData, 'metaRoute'>

function DomainArea({ data }: NodeProps<DomainFlowNode>) {
  const style = domainStyle[data.domain]
  return <section className={`h-full w-full overflow-hidden rounded-[1.75rem] border-2 border-dashed ${style.border} ${style.surface}`}>
    <div className={`h-2 ${style.bar}`} />
    <header className="px-5 py-4">
      <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-950">{data.label}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-black ring-1 ring-inset ${style.badge}`}>{data.count} entities</span></div>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">{data.description}</p>
    </header>
  </section>
}

function EntityCard({ data, selected }: NodeProps<EntityFlowNode>) {
  const primary = domainStyle[data.entity.primaryDomain]
  const colors = data.entity.domains.map((domain) => domainStyle[domain].color)
  const bar = colors.length === 1 ? colors[0] : `linear-gradient(90deg, ${colors.join(', ')})`
  return <article className={`h-[96px] w-[286px] overflow-hidden rounded-2xl border bg-white shadow-[0_16px_38px_-28px_rgba(15,23,42,.65)] transition ${selected ? 'border-slate-700 ring-4 ring-slate-900/10' : 'border-slate-200'}`}>
    {data.ports.map((port) => <Handle
      key={port.id}
      id={port.id}
      type={port.type}
      position={port.position === 'left' ? Position.Left : Position.Right}
      style={{ top: `${port.top}%` }}
      className={`!size-2.5 !border-2 !border-white ${port.type === 'source' ? '!bg-slate-700' : '!bg-slate-400'}`}
    />)}
    <div className="h-1.5" style={{ background: bar }} />
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="truncate font-mono text-xs font-black text-slate-950">{data.entity.name}</h4>
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide ring-1 ring-inset ${primary.badge}`}>{data.entity.domains.length > 1 ? `${data.entity.domains.length}-area` : 'core'}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[9px] leading-3.5 text-slate-500">{data.entity.purpose}</p>
      <p className="mt-1.5 flex items-center gap-1 truncate font-mono text-[8px] font-bold text-slate-400"><KeyRound size={8} />{data.entity.keyFields.slice(0, 3).join(' · ')}</p>
    </div>
  </article>
}

function RoutedMetaEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, data }: EdgeProps<MetaFlowEdge>) {
  const route = data?.route ?? 'corridor'
  let path = ''
  let labelX = (sourceX + targetX) / 2
  let labelY = (sourceY + targetY) / 2

  if (route === 'local') {
    const laneX = Math.max(sourceX, targetX) + 42 + (data?.laneOffset ?? 0) * 11
    path = `M ${sourceX} ${sourceY} L ${laneX} ${sourceY} L ${laneX} ${targetY} L ${targetX} ${targetY}`
    labelX = laneX
  } else if (route === 'upper') {
    const forward = sourceX < targetX
    const sourceExit = sourceX + (forward ? 30 : -30)
    const targetEntry = targetX + (forward ? -30 : 30)
    const laneY = 82 - (data?.laneOffset ?? 0) * 16
    path = `M ${sourceX} ${sourceY} L ${sourceExit} ${sourceY} L ${sourceExit} ${laneY} L ${targetEntry} ${laneY} L ${targetEntry} ${targetY} L ${targetX} ${targetY}`
    labelY = laneY
  } else {
    const laneFraction = data?.laneFraction ?? 0.5
    const laneX = Math.min(sourceX, targetX) + Math.abs(targetX - sourceX) * laneFraction
    path = `M ${sourceX} ${sourceY} L ${laneX} ${sourceY} L ${laneX} ${targetY} L ${targetX} ${targetY}`
    labelX = (sourceX + laneX) / 2
    labelY = sourceY
  }

  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
    <EdgeLabelRenderer><span className="pointer-events-none nodrag nopan absolute rounded-full bg-white/95 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/70" style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>{data?.label}</span></EdgeLabelRenderer>
  </>
}

const nodeTypes = { domain: DomainArea, metaEntity: EntityCard }
const edgeTypes = { metaRoute: RoutedMetaEdge }

type EntityLayout = { id: string; domain: MetaModelDomainId; domainIndex: number; x: number; y: number }
type PendingPort = Omit<MetaPort, 'top'> & { otherY: number }

function buildGraph(model: MetaModelPayload) {
  const domains = [...model.domains].sort((left, right) => left.order - right.order)
  const domainIndex = new Map(domains.map((domain, index) => [domain.id, index]))
  const entitiesByDomain = new Map(domains.map((domain) => [domain.id, model.entities.filter((entity) => entity.primaryDomain === domain.id)]))
  const layouts: EntityLayout[] = []
  const nodes: MetaFlowNode[] = []

  domains.forEach((domain, index) => {
    const entities = entitiesByDomain.get(domain.id) ?? []
    const height = 92 + entities.length * (ENTITY_HEIGHT + ENTITY_GAP) + 20
    const groupX = index * (GROUP_WIDTH + GROUP_GAP)
    nodes.push({ id: `domain-${domain.id}`, type: 'domain', position: { x: groupX, y: GROUP_TOP }, data: { label: domain.label, description: domain.description, domain: domain.id, count: entities.length }, style: { width: GROUP_WIDTH, height }, selectable: false, zIndex: -1 })
    entities.forEach((entity, entityIndex) => layouts.push({ id: entity.id, domain: domain.id, domainIndex: index, x: groupX + 30, y: GROUP_TOP + 88 + entityIndex * (ENTITY_HEIGHT + ENTITY_GAP) }))
  })

  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))
  const pendingPorts = new Map<string, PendingPort[]>()
  const addPort = (nodeId: string, port: PendingPort) => pendingPorts.set(nodeId, [...(pendingPorts.get(nodeId) ?? []), port])
  const routeGroups = new Map<string, typeof model.relationships>()

  for (const relationship of model.relationships) {
    const source = layoutById.get(relationship.source)
    const target = layoutById.get(relationship.target)
    if (!source || !target) continue
    const span = Math.abs(source.domainIndex - target.domainIndex)
    const route = span === 0 ? 'local' : span === 1 ? 'corridor' : 'upper'
    const forward = source.domainIndex <= target.domainIndex
    addPort(relationship.source, { id: `source-${relationship.id}`, type: 'source', position: route === 'local' ? 'right' : forward ? 'right' : 'left', otherY: target.y })
    addPort(relationship.target, { id: `target-${relationship.id}`, type: 'target', position: route === 'local' ? 'right' : forward ? 'left' : 'right', otherY: source.y })
    const key = route === 'local' ? `local:${source.domainIndex}` : route === 'upper' ? 'upper' : `corridor:${Math.min(source.domainIndex, target.domainIndex)}`
    routeGroups.set(key, [...(routeGroups.get(key) ?? []), relationship])
  }

  const portsByNode = new Map<string, MetaPort[]>()
  for (const [nodeId, ports] of pendingPorts) {
    const bySide = new Map<'left' | 'right', PendingPort[]>()
    ports.forEach((port) => bySide.set(port.position, [...(bySide.get(port.position) ?? []), port]))
    for (const sidePorts of bySide.values()) {
      const ordered = [...sidePorts].sort((left, right) => left.otherY - right.otherY)
      ordered.forEach((port, index) => {
        const placed = { ...port, top: 22 + ((index + 1) * 64) / (ordered.length + 1) }
        portsByNode.set(nodeId, [...(portsByNode.get(nodeId) ?? []), placed])
      })
    }
  }

  for (const layout of layouts) {
    const entity = model.entities.find((candidate) => candidate.id === layout.id)!
    nodes.push({ id: entity.id, type: 'metaEntity', parentId: `domain-${entity.primaryDomain}`, extent: 'parent', position: { x: 30, y: layout.y - GROUP_TOP }, data: { entity, ports: portsByNode.get(entity.id) ?? [] }, style: { width: ENTITY_WIDTH, height: ENTITY_HEIGHT }, zIndex: 4 })
  }

  const laneByEdge = new Map<string, { route: MetaEdgeData['route']; laneFraction: number; laneOffset: number }>()
  for (const [key, relationships] of routeGroups) {
    const route: MetaEdgeData['route'] = key.startsWith('local:') ? 'local' : key === 'upper' ? 'upper' : 'corridor'
    const ordered = [...relationships].sort((left, right) => (layoutById.get(left.source)?.y ?? 0) - (layoutById.get(right.source)?.y ?? 0) || (layoutById.get(left.target)?.y ?? 0) - (layoutById.get(right.target)?.y ?? 0))
    ordered.forEach((relationship, index) => laneByEdge.set(relationship.id, { route, laneFraction: (index + 1) / (ordered.length + 1), laneOffset: index }))
  }

  const edges: MetaFlowEdge[] = model.relationships.map((relationship) => {
    const lane = laneByEdge.get(relationship.id) ?? { route: 'corridor' as const, laneFraction: 0.5, laneOffset: 0 }
    return { id: relationship.id, source: relationship.source, target: relationship.target, sourceHandle: `source-${relationship.id}`, targetHandle: `target-${relationship.id}`, type: 'metaRoute', data: { label: `${relationship.label} · ${relationship.cardinality}`, ...lane }, markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 14, height: 14 }, style: { stroke: '#94a3b8', strokeWidth: 1.35 }, zIndex: 2 }
  })

  return { nodes, edges }
}

export function MetaModelView({ model }: { model: MetaModelPayload }) {
  const graph = useMemo(() => buildGraph(model), [model])
  const crossCutting = model.entities.filter((entity) => entity.domains.length > 1).length
  return <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-60px_rgba(15,23,42,.65)]">
    <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-violet-300"><Boxes size={20} /></span><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-violet-700">Group-wide retail schema</p><h2 className="mt-0.5 text-lg font-black text-slate-950">Retail KYC metamodel</h2><p className="mt-0.5 text-xs text-slate-500">Entity types, ownership boundaries and control handovers</p></div></div>
      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600"><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5"><Layers3 size={12} />{model.entities.length} entity types</span><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5"><GitBranch size={12} />{model.relationships.length} relationships</span><span className="rounded-full bg-violet-50 px-2.5 py-1.5 text-violet-700">{crossCutting} cross-cutting</span></div>
    </header>
    <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold text-slate-500 sm:px-7">
      {model.domains.map((domain) => <span key={domain.id} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: domainStyle[domain.id].color }} />{domain.label}</span>)}
      <span className="ml-auto inline-flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-amber-500" />Mixed bar = handover or cross-cutting entity</span>
    </div>
    <div className="h-[820px] bg-[#f8faf9]">
      <ReactFlow nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.08, maxZoom: 0.78 }} minZoom={0.25} maxZoom={1.5} nodesDraggable={false} nodesConnectable={false} deleteKeyCode={null} proOptions={{ hideAttribution: true }} aria-label="Retail KYC metamodel split into Party master, Identity facts, Customer relationship, and CDD and evidence areas">
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  </section>
}
