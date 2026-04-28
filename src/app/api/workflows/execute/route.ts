import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── POST /api/workflows/execute — start a workflow execution ────────────────
//
// Body: { workflowId: string, input?: object }
//
// The execution engine:
// 1. Creates a WorkflowExecution record
// 2. Creates StepExecution records for each pipeline step
// 3. Resolves which agent runs each step (agentId or roleGroup → pick first active agent)
// 4. Simulates execution with realistic timing (real execution would use LLM/orchestration)
// 5. Passes TaskContext between steps (context accumulates)
// 6. Handles feedback loops: if step action=review and result=reject → jump back
// 7. Records AgentMessages for each step transition

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workflowId, input } = body

    if (!workflowId) {
      return NextResponse.json({ error: 'workflowId is required' }, { status: 400 })
    }

    // Load workflow with steps
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (workflow.steps.length === 0) {
      return NextResponse.json({ error: 'Workflow has no steps' }, { status: 400 })
    }

    // Load all agents for resolution
    const agents = await db.agent.findMany()
    const agentMap = new Map(agents.map(a => [a.id, a]))

    // Resolve agent for each step
    const resolvedSteps = workflow.steps.map(step => {
      let resolvedAgentId = step.agentId
      if (!resolvedAgentId && step.roleGroup) {
        const groupAgent = agents.find(a =>
          a.roleGroup === step.roleGroup && a.status === 'active'
        )
        resolvedAgentId = groupAgent?.id || null
      }
      return { step, resolvedAgentId }
    })

    // Create execution
    const execution = await db.workflowExecution.create({
      data: {
        workflowId,
        status: 'running',
        input: JSON.stringify(input || {}),
        taskContext: JSON.stringify({ ...(input || {}), _history: [] }),
      },
    })

    // Create step executions
    const stepExecutions = await Promise.all(
      resolvedSteps.map(({ step, resolvedAgentId }) =>
        db.stepExecution.create({
          data: {
            executionId: execution.id,
            stepId: step.id,
            agentId: resolvedAgentId,
            status: 'pending',
            inputData: '{}',
            outputData: '{}',
          },
        })
      )
    )

    // ─── Simulate pipeline execution ──────────────────────────────────────
    // In a real system, each step would trigger an agent via LLM/orchestration.
    // Here we simulate with realistic patterns and timing.

    const taskContext: any = { ...(input || {}), _history: [] }
    let previousOutput: any = input || {}
    let finalStatus = 'completed'
    let finalError: string | null = null

    for (let i = 0; i < resolvedSteps.length; i++) {
      const { step, resolvedAgentId } = resolvedSteps[i]
      const stepExec = stepExecutions[i]
      const agent = resolvedAgentId ? agentMap.get(resolvedAgentId) : null

      // Skip if no agent available
      if (!resolvedAgentId) {
        await db.stepExecution.update({
          where: { id: stepExec.id },
          data: { status: 'skipped', error: 'No available agent' },
        })
        continue
      }

      // Mark step as running
      await db.stepExecution.update({
        where: { id: stepExec.id },
        data: {
          status: 'running',
          startedAt: new Date(),
          inputData: JSON.stringify(previousOutput),
        },
      })

      // Record request message
      await db.agentMessage.create({
        data: {
          stepExecutionId: stepExec.id,
          fromAgentId: i === 0 ? 'system' : (resolvedSteps[i - 1].resolvedAgentId || 'system'),
          toAgentId: resolvedAgentId,
          type: 'request',
          content: JSON.stringify({
            task: step.name,
            action: step.action,
            input: previousOutput,
          }),
          metadata: JSON.stringify({ stepOrder: step.order, pipelinePosition: `${i + 1}/${resolvedSteps.length}` }),
        },
      })

      // ─── Simulate step execution based on action type ────────────────────
      const stepOutput = simulateStepExecution(step, previousOutput, agent, taskContext)

      // Check for feedback loop (review action that rejects)
      const isFeedbackLoop = step.action === 'review' &&
        stepOutput._reviewResult === 'reject' &&
        step.fallbackStepId

      if (isFeedbackLoop) {
        // Record feedback message
        await db.agentMessage.create({
          data: {
            stepExecutionId: stepExec.id,
            fromAgentId: resolvedAgentId,
            toAgentId: resolvedSteps[i - 1]?.resolvedAgentId || 'system',
            type: 'feedback',
            content: JSON.stringify({
              reviewResult: 'reject',
              reason: stepOutput._reviewReason || 'Quality threshold not met',
              feedback: stepOutput._feedback || 'Please revise and resubmit',
            }),
            metadata: JSON.stringify({ feedbackLoop: true, targetStep: step.fallbackStepId }),
          },
        })

        // Mark step as waiting feedback
        await db.stepExecution.update({
          where: { id: stepExec.id },
          data: {
            status: 'waiting_feedback',
            completedAt: new Date(),
            outputData: JSON.stringify(stepOutput),
          },
        })
      } else {
        // Normal completion
        await db.stepExecution.update({
          where: { id: stepExec.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            outputData: JSON.stringify(stepOutput),
          },
        })

        // Record response message
        await db.agentMessage.create({
          data: {
            stepExecutionId: stepExec.id,
            fromAgentId: resolvedAgentId,
            toAgentId: i < resolvedSteps.length - 1 ? (resolvedSteps[i + 1]?.resolvedAgentId || 'system') : 'system',
            type: 'response',
            content: JSON.stringify(stepOutput),
            metadata: JSON.stringify({ stepOrder: step.order }),
          },
        })
      }

      // Update task context
      taskContext._history.push({
        step: step.name,
        agent: agent?.name || 'unknown',
        action: step.action,
        timestamp: new Date().toISOString(),
        status: isFeedbackLoop ? 'feedback_requested' : 'completed',
      })
      previousOutput = stepOutput
    }

    // Update execution with final results
    await db.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: finalStatus,
        taskContext: JSON.stringify(taskContext),
        output: JSON.stringify(previousOutput),
        error: finalError,
        completedAt: new Date(),
      },
    })

    // Return full execution with steps and messages
    const fullExecution = await db.workflowExecution.findUnique({
      where: { id: execution.id },
      include: {
        steps: {
          include: { messages: true },
          orderBy: { id: 'asc' },
        },
      },
    })

    return NextResponse.json({ execution: fullExecution }, { status: 201 })
  } catch (error: any) {
    console.error('[/api/workflows/execute POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── Simulation engine ────────────────────────────────────────────────────────

function simulateStepExecution(
  step: { action: string; name: string; roleGroup: string | null; config: string },
  input: any,
  agent: { name: string; role: string; formula: string } | undefined,
  context: any
): any {
  const config = typeof step.config === 'string' ? JSON.parse(step.config) : step.config

  switch (step.action) {
    case 'process':
      return {
        ...input,
        _processedBy: agent?.name || 'system',
        _processingResult: 'success',
        _timestamp: new Date().toISOString(),
        [step.name.toLowerCase().replace(/\s+/g, '_')]: {
          status: 'processed',
          agent: agent?.name,
          formula: agent?.formula,
        },
      }

    case 'review': {
      // 80% chance of approval, 20% chance of rejection (simulates feedback loop)
      const approved = Math.random() > 0.2
      return {
        ...input,
        _reviewResult: approved ? 'approved' : 'reject',
        _reviewReason: approved ? 'Meets quality standards' : 'Quality threshold not met',
        _reviewedBy: agent?.name || 'system',
        _feedback: approved ? undefined : 'Needs improvement in accuracy and completeness',
        _timestamp: new Date().toISOString(),
      }
    }

    case 'transform':
      return {
        ...input,
        _transformedBy: agent?.name || 'system',
        _transformType: config.transformType || 'format',
        _transformResult: 'transformed',
        _timestamp: new Date().toISOString(),
      }

    case 'delegate':
      return {
        ...input,
        _delegatedBy: agent?.name || 'system',
        _delegatedTo: config.targetGroup || step.roleGroup,
        _delegationReason: config.reason || 'Specialized processing required',
        _timestamp: new Date().toISOString(),
      }

    case 'broadcast':
      return {
        ...input,
        _broadcastBy: agent?.name || 'system',
        _broadcastTargets: context._history?.length || 0,
        _broadcastResult: 'delivered',
        _timestamp: new Date().toISOString(),
      }

    case 'decision': {
      const condition = config.condition || 'default'
      const branch = condition === 'quality_check'
        ? (Math.random() > 0.3 ? 'pass' : 'fail')
        : 'default'
      return {
        ...input,
        _decisionBy: agent?.name || 'system',
        _decisionBranch: branch,
        _decisionReason: `Condition "${condition}" evaluated to "${branch}"`,
        _timestamp: new Date().toISOString(),
      }
    }

    default:
      return {
        ...input,
        _processedBy: agent?.name || 'system',
        _timestamp: new Date().toISOString(),
      }
  }
}
