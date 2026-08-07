import { useMemo } from 'react'
import {
  BaseEdge,
  Background,
  BackgroundVariant,
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
import '@xyflow/react/dist/style.css'
import { BadgeCheck, CircleAlert, CircleDashed, Database, GitBranch, KeyRound, Link2, Star } from 'lucide-react'
import { layoutDataModel, routeDataModelEdges } from '../lib/dataModelLayout'
import type { CustomerDataModel, DataModelFieldState, DataModelLayer } from '../types/sdui'

type EntityPort = {
  id: string
  type: 'source' | 'target'
  position: 'left' | 'right' | 'top' | 'bottom'
  top: number
}

type EntityNodeData = {
  entity: string
  recordLabel: string
  layer: DataModelLayer
  state: DataModelFieldState
  emphasis: CustomerDataModel['nodes'][number]['emphasis']
  fields: CustomerDataModel['nodes'][number]['fields']
  ports: EntityPort[]
} & Record<string, unknown>

type EntityFlowNode = Node<EntityNodeData, 'entity'>

type RoutedEdgeData = {
  label: string
  laneFraction: number
  orientation: 'horizontal' | 'vertical'
} & Record<string, unknown>

type RoutedFlowEdge = Edge<RoutedEdgeData, 'routed'>

const layerStyle: Record<DataModelLayer, { badge: string; bar: string; label: string }> = {
  identity: { badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200', bar: 'bg-cyan-500', label: 'Identity' },
  party: { badge: 'bg-violet-50 text-violet-700 ring-violet-200', bar: 'bg-violet-500', label: 'Party master' },
  relationship: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500', label: 'Relationship' },
  assurance: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', bar: 'bg-amber-500', label: 'CDD & assurance' },
}

const stateStyle: Record<DataModelFieldState, { dot: string; text: string; label: string }> = {
  verified: { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Verified' },
  current: { dot: 'bg-sky-500', text: 'text-sky-700', label: 'Current' },
  pending: { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Pending' },
  missing: { dot: 'bg-rose-500', text: 'text-rose-700', label: 'Missing' },
  changed: { dot: 'bg-violet-500', text: 'text-violet-700', label: 'Changed' },
}

function StateIcon({ state }: { state?: DataModelFieldState }) {
  if (state === 'verified') return <BadgeCheck className="shrink-0 text-emerald-500" size={13} />
  if (state === 'missing') return <CircleAlert className="shrink-0 text-rose-500" size={13} />
  if (state === 'pending' || state === 'changed') return <CircleDashed className={`shrink-0 ${state === 'changed' ? 'text-violet-500' : 'text-amber-500'}`} size={13} />
  return null
}

function EntityCard({ data, selected }: NodeProps<EntityFlowNode>) {
  const layer = layerStyle[data.layer]
  const state = stateStyle[data.state]
  return (
    <article className={`w-[286px] overflow-hidden rounded-2xl border bg-white transition ${data.emphasis === 'primary' ? 'border-slate-700 shadow-[0_22px_58px_-26px_rgba(15,23,42,.7)] ring-2 ring-slate-900/10' : 'border-slate-200 shadow-[0_18px_50px_-30px_rgba(15,23,42,.55)]'} ${selected ? '!border-violet-600 !ring-4 !ring-violet-500/15' : ''}`}>
      {data.ports.map((port) => {
        const position = port.position === 'left' ? Position.Left : port.position === 'right' ? Position.Right : port.position === 'top' ? Position.Top : Position.Bottom
        const verticalSide = port.position === 'top' || port.position === 'bottom'
        return <Handle key={port.id} id={port.id} type={port.type} position={position} style={verticalSide ? { left: `${port.top}%` } : { top: `${port.top}%` }} className={`!size-2.5 !border-2 !border-white ${port.type === 'source' ? '!bg-slate-700' : '!bg-slate-400'}`} />
      })}
      <div className={`h-1.5 ${layer.bar}`} />
      <header className="border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5"><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[.12em] ring-1 ring-inset ${layer.badge}`}>{layer.label}</span>{data.emphasis === 'primary' && <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white"><Star size={9} fill="currentColor" />Primary</span>}</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${state.text}`}><span className={`size-1.5 rounded-full ${state.dot}`} />{state.label}</span>
        </div>
        <h3 className="mt-2 font-mono text-sm font-black tracking-tight text-slate-950">{data.entity}</h3>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{data.recordLabel}</p>
      </header>
      <dl className="divide-y divide-slate-100 px-4 py-1">
        {data.fields.map((field) => <div key={`${field.name}-${field.value}`} className={`grid grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] gap-3 py-2 ${field.state === 'missing' ? 'bg-rose-50/60' : field.state === 'pending' ? 'bg-amber-50/50' : ''}`}>
          <dt className="flex min-w-0 items-center gap-1.5 font-mono text-[9px] font-bold text-slate-500"><StateIcon state={field.state} /><span className="truncate" title={field.name}>{field.name}</span>{field.key && <span className="ml-auto inline-flex items-center gap-0.5 rounded bg-slate-100 px-1 py-0.5 font-sans text-[8px] font-black text-slate-500"><KeyRound size={8} />{field.key}</span>}</dt>
          <dd className={`break-words text-right text-[10px] font-bold leading-4 ${field.state === 'missing' ? 'text-rose-700' : field.state === 'pending' ? 'text-amber-800' : 'text-slate-900'}`}>{field.value}</dd>
        </div>)}
      </dl>
    </article>
  )
}

const nodeTypes = { entity: EntityCard }

function RoutedEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, data }: EdgeProps<RoutedFlowEdge>) {
  const laneFraction = data?.laneFraction ?? 0.5
  const horizontal = data?.orientation !== 'vertical'
  const laneX = Math.min(sourceX, targetX) + Math.abs(targetX - sourceX) * laneFraction
  const laneY = Math.min(sourceY, targetY) + Math.abs(targetY - sourceY) * laneFraction
  const path = horizontal
    ? `M ${sourceX} ${sourceY} L ${laneX} ${sourceY} L ${laneX} ${targetY} L ${targetX} ${targetY}`
    : `M ${sourceX} ${sourceY} L ${sourceX} ${laneY} L ${targetX} ${laneY} L ${targetX} ${targetY}`
  const labelX = horizontal ? (sourceX + laneX) / 2 : sourceX
  const labelY = horizontal ? sourceY : (sourceY + laneY) / 2

  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
    <EdgeLabelRenderer>
      <div
        className="pointer-events-none nodrag nopan absolute rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200/70"
        style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
      >
        {data?.label}
      </div>
    </EdgeLabelRenderer>
  </>
}

const edgeTypes = { routed: RoutedEdge }

type PendingPort = Omit<EntityPort, 'top'> & { otherY: number }

function graphPorts(model: CustomerDataModel, layouts: ReturnType<typeof layoutDataModel>) {
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))
  const sides = new Map<string, PendingPort[]>()
  const addPort = (nodeId: string, port: PendingPort) => {
    const sideKey = `${nodeId}:${port.position}`
    sides.set(sideKey, [...(sides.get(sideKey) ?? []), port])
  }

  for (const relationship of model.edges) {
    const source = layoutById.get(relationship.source)
    const target = layoutById.get(relationship.target)
    if (!source || !target) continue
    if (source.x === target.x) {
      const downward = source.y < target.y
      addPort(relationship.source, { id: `source-${relationship.id}`, type: 'source', position: downward ? 'bottom' : 'top', otherY: target.x })
      addPort(relationship.target, { id: `target-${relationship.id}`, type: 'target', position: downward ? 'top' : 'bottom', otherY: source.x })
    } else {
      const forward = source.x < target.x
      addPort(relationship.source, { id: `source-${relationship.id}`, type: 'source', position: forward ? 'right' : 'left', otherY: target.y })
      addPort(relationship.target, { id: `target-${relationship.id}`, type: 'target', position: forward ? 'left' : 'right', otherY: source.y })
    }
  }

  const portsByNode = new Map<string, EntityPort[]>()
  for (const [sideKey, pending] of sides) {
    const nodeId = sideKey.slice(0, sideKey.lastIndexOf(':'))
    const ordered = [...pending].sort((left, right) => left.otherY - right.otherY)
    const ports = ordered.map((port, index) => ({
      id: port.id,
      type: port.type,
      position: port.position,
      top: 24 + ((index + 1) * 64) / (ordered.length + 1),
    }))
    portsByNode.set(nodeId, [...(portsByNode.get(nodeId) ?? []), ...ports])
  }
  return portsByNode
}

function graphNodes(model: CustomerDataModel): EntityFlowNode[] {
  const layouts = layoutDataModel(model)
  const layoutById = new Map(layouts.map((layout) => [layout.id, layout]))
  const ports = graphPorts(model, layouts)
  return model.nodes.map((modelNode) => {
    const layout = layoutById.get(modelNode.id)
    return {
      id: modelNode.id,
      type: 'entity',
      position: { x: layout?.x ?? 0, y: layout?.y ?? 0 },
      data: {
        entity: modelNode.entity,
        recordLabel: modelNode.recordLabel,
        layer: modelNode.layer,
        state: modelNode.state,
        emphasis: modelNode.emphasis,
        fields: modelNode.fields,
        ports: ports.get(modelNode.id) ?? [],
      },
    }
  })
}

function graphEdges(model: CustomerDataModel): RoutedFlowEdge[] {
  const laneByEdge = new Map(routeDataModelEdges(model).map((lane) => [lane.edgeId, lane]))
  return model.edges.map((modelEdge) => {
    const lane = laneByEdge.get(modelEdge.id)
    return {
      id: modelEdge.id,
      source: modelEdge.source,
      target: modelEdge.target,
      sourceHandle: `source-${modelEdge.id}`,
      targetHandle: `target-${modelEdge.id}`,
      type: 'routed',
      data: {
        label: `${modelEdge.label}  ·  ${modelEdge.cardinality}`,
        laneFraction: lane?.laneFraction ?? 0.5,
        orientation: lane?.orientation ?? 'horizontal',
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 16, height: 16 },
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    }
  })
}

export function DataModelView({ model, customerName }: { model: CustomerDataModel; customerName: string }) {
  const nodes = useMemo(() => graphNodes(model), [model])
  const edges = useMemo(() => graphEdges(model), [model])
  const openItems = model.nodes.filter((item) => item.state === 'missing' || item.state === 'pending').length

  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-60px_rgba(15,23,42,.65)]">
      <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-emerald-300"><Database size={20} /></div>
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Populated group model</p><h2 className="mt-0.5 text-lg font-black text-slate-950">{customerName}</h2><p className="mt-0.5 text-xs text-slate-500">{model.partyId} · {model.customerId}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5"><Database size={12} />{model.nodes.length} records</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5"><GitBranch size={12} />{model.edges.length} relationships</span>
          {openItems > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-amber-800"><CircleDashed size={12} />{openItems} open</span>}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold text-slate-500 sm:px-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-2.5 py-1 text-white"><Star size={10} fill="currentColor" />Primary customer record</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-violet-500" />Party master</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-cyan-500" />Identity facts</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Customer relationship</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />CDD and evidence</span>
        <span className="ml-auto hidden items-center gap-1 text-slate-400 sm:inline-flex"><Link2 size={12} />Pan or zoom to inspect</span>
      </div>

      <div className="h-[720px] bg-[#f8faf9]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 0.85 }}
          minZoom={0.25}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: true }}
          aria-label={`Populated KYC data model for ${customerName}`}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#cbd5e1" />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </section>
  )
}
