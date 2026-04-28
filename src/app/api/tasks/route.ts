import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: Record<string, unknown> = {}
    if (agentId) where.agentId = agentId
    if (status) where.status = status
    if (priority) where.priority = priority

    const tasks = await db.task.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Verify agent exists if agentId provided
    if (body.agentId) {
      const agent = await db.agent.findUnique({ where: { id: body.agentId } })
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }
    }

    const task = await db.task.create({
      data: {
        title: body.title.trim(),
        description: body.description || '',
        status: body.status || 'pending',
        priority: body.priority || 'medium',
        agentId: body.agentId || null,
      },
      include: { agent: true },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
