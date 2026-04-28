import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await db.agent.findUnique({
      where: { id },
      include: { children: true, twin: true, twinOf: true, tasks: true },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to fetch agent:', error)
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify agent exists
    const existing = await db.agent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const agent = await db.agent.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        roleGroup: body.roleGroup,
        status: body.status,
        formula: body.formula,
        skills: body.skills,
        description: body.description,
      },
      include: { children: true, tasks: true },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify agent exists
    const existing = await db.agent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const agent = await db.agent.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.roleGroup !== undefined && { roleGroup: body.roleGroup }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.formula !== undefined && { formula: body.formula }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.twinId !== undefined && { twinId: body.twinId }),
        ...(body.skills !== undefined && { skills: body.skills }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
      },
      include: { children: true, tasks: true },
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify agent exists
    const existing = await db.agent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Unlink children (set parentId to null)
    await db.agent.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    })

    // Unlink twin references
    await db.agent.updateMany({
      where: { twinId: id },
      data: { twinId: null },
    })

    // Delete associated tasks
    await db.task.deleteMany({
      where: { agentId: id },
    })

    // Delete the agent
    await db.agent.delete({ where: { id } })

    return NextResponse.json({ message: 'Agent deleted successfully', id })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
