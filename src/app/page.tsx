'use client'

import dynamic from 'next/dynamic'

const AgentHierarchy = dynamic(
  () => import('@/components/agent-hierarchy'),
  { ssr: false }
)

export default function Home() {
  return <AgentHierarchy />
}
