'use client'

import dynamic from 'next/dynamic'

const AgentHierarchy = dynamic(
  () => import('@/components/hierarchy/agent-hierarchy-v2'),
  { ssr: false }
)

export default function HierarchyPage() {
  return <AgentHierarchy />
}
