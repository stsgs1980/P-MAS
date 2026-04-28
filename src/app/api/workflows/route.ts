import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET /api/workflows — list all workflows with step counts & execution stats ──

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get('status')
    const triggerType = req.nextUrl.searchParams.get('triggerType')

    const where: any = {}
    if (status) where.status = status
    if (triggerType) where.triggerType = triggerType

    const workflows = await db.workflow.findMany({
      where,
      include: {
        steps: { orderBy: { order: 'asc' } },
        executions: {
          take: 5,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
        _count: { select: { executions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Compute stats for each workflow
    const result = workflows.map(wf => {
      const totalExecutions = wf._count.executions
      const completedExecutions = wf.executions.filter(e => e.status === 'completed').length
      const runningExecutions = wf.executions.filter(e => e.status === 'running').length
      const failedExecutions = wf.executions.filter(e => e.status === 'failed').length

      return {
        id: wf.id,
        name: wf.name,
        description: wf.description,
        status: wf.status,
        triggerType: wf.triggerType,
        triggerConfig: JSON.parse(wf.triggerConfig),
        version: wf.version,
        tags: wf.tags ? wf.tags.split(',').filter(Boolean) : [],
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
        stepCount: wf.steps.length,
        steps: wf.steps.map(s => ({
          id: s.id,
          order: s.order,
          name: s.name,
          agentId: s.agentId,
          roleGroup: s.roleGroup,
          action: s.action,
          inputSchema: JSON.parse(s.inputSchema),
          outputSchema: JSON.parse(s.outputSchema),
          condition: JSON.parse(s.condition),
          fallbackStepId: s.fallbackStepId,
          timeout: s.timeout,
          retryPolicy: JSON.parse(s.retryPolicy),
          config: JSON.parse(s.config),
        })),
        stats: {
          totalExecutions,
          completedExecutions,
          runningExecutions,
          failedExecutions,
          successRate: totalExecutions > 0
            ? Math.round((completedExecutions / totalExecutions) * 100)
            : 0,
        },
        recentExecutions: wf.executions,
      }
    })

    return NextResponse.json({ workflows: result })
  } catch (error: any) {
    console.error('[/api/workflows GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── POST /api/workflows — create a new workflow ─────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, triggerType, triggerConfig, tags, steps } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 })
    }

    const workflow = await db.workflow.create({
      data: {
        name: name.trim(),
        description: description || '',
        status: 'draft',
        triggerType: triggerType || 'manual',
        triggerConfig: JSON.stringify(triggerConfig || {}),
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
        steps: steps?.length
          ? {
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
            }
          : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error: any) {
    console.error('[/api/workflows POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
