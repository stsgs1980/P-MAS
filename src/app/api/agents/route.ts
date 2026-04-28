import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      include: { children: true, tasks: true },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(agents)
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const agent = await db.agent.create({
      data: {
        name: body.name,
        role: body.role,
        roleGroup: body.roleGroup,
        status: body.status || 'active',
        formula: body.formula,
        parentId: body.parentId || null,
        twinId: body.twinId || null,
        skills: body.skills || '',
        description: body.description || '',
        avatar: body.avatar || '',
      }
    })
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
