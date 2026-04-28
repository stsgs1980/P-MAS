import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET /api/workflows/[id] — single workflow detail ────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const workflow = await db.workflow.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: 'asc' } },
        executions: {
          take: 20,
          orderBy: { startedAt: 'desc' },
          include: {
            steps: {
              include: {
                messages: { orderBy: { timestamp: 'asc' } },
              },
            },
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('[/api/workflows/[id] GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── PUT /api/workflows/[id] — update workflow ──────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, status, triggerType, triggerConfig, tags, steps } = body

    // If steps are provided, replace all existing steps
    if (steps) {
      await db.pipelineStep.deleteMany({ where: { workflowId: id } })
    }

    const workflow = await db.workflow.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(triggerType !== undefined && { triggerType }),
        ...(triggerConfig !== undefined && { triggerConfig: JSON.stringify(triggerConfig) }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
        ...(steps && {
          steps: {
            create: steps.map((s: any, i: number) => ({
              order: s.order ?? i,
              name: s.name || `Step ${i + 1}`,
              agentId: s.agentId || null,
              roleGroup: s.roleGroup || null,
              action: s.action || 'process',
              inputSchema: JSON.stringify(s.inputSchema || {}),
              outputSchema: JSON.stringify(s.outputSchema || {}),
              condition: JSON.stringify(s.condition || {}),
              fallbackStepId: s.fallbackStepId || null,
              timeout: s.timeout || 300,
              retryPolicy: JSON.stringify(s.retryPolicy || {}),
              config: JSON.stringify(s.config || {}),
            })),
          },
        }),
        version: { increment: steps ? 1 : 0 },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ workflow })
  } catch (error: any) {
    console.error('[/api/workflows/[id] PUT]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── DELETE /api/workflows/[id] ─────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.workflow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[/api/workflows/[id] DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
