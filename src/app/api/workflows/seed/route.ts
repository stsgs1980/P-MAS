import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── POST /api/workflows/seed — seed sample workflows with pipeline steps ────

export async function POST() {
  try {
    // Load agents for reference
    const agents = await db.agent.findMany()
    const byName = new Map(agents.map(a => [a.name, a]))
    const getAgent = (name: string) => byName.get(name)

    // Clear existing workflows
    await db.workflow.deleteMany()

    // ─── Workflow 1: Full Development Pipeline ────────────────────────────
    // Request → Strateg → Koordinator → Koder → Testirovshchik → Revizor
    // With feedback loop: if Testirovshchik finds bugs → back to Koder
    const devPipeline = await db.workflow.create({
      data: {
        name: 'Development Pipeline',
        description: 'Полный цикл разработки: от запроса до готового кода с проверкой качества',
        status: 'active',
        triggerType: 'manual',
        tags: 'development,coding,core',
        steps: {
          create: [
            {
              order: 0,
              name: 'Receive Request',
              roleGroup: 'Стратегия',
              action: 'process',
              inputSchema: JSON.stringify({ type: 'object', properties: { taskDescription: { type: 'string' }, priority: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { taskPlan: { type: 'string' }, requirements: { type: 'array' } } }),
              config: JSON.stringify({ promptTemplate: 'Analyze request and create execution plan' }),
              timeout: 120,
            },
            {
              order: 1,
              name: 'Plan & Decompose',
              roleGroup: 'Тактика',
              action: 'transform',
              inputSchema: JSON.stringify({ type: 'object', properties: { taskPlan: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { subtasks: { type: 'array' }, assignments: { type: 'object' } } }),
              config: JSON.stringify({ transformType: 'decompose', promptTemplate: 'Break down plan into subtasks and assign agents' }),
              timeout: 180,
            },
            {
              order: 2,
              name: 'Implement Code',
              roleGroup: 'Исполнение',
              action: 'process',
              inputSchema: JSON.stringify({ type: 'object', properties: { subtasks: { type: 'array' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { code: { type: 'string' }, files: { type: 'array' } } }),
              config: JSON.stringify({ promptTemplate: 'Write code according to specifications' }),
              timeout: 600,
            },
            {
              order: 3,
              name: 'Test & Debug',
              roleGroup: 'Исполнение',
              action: 'review',
              inputSchema: JSON.stringify({ type: 'object', properties: { code: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { testResults: { type: 'object' }, bugs: { type: 'array' } } }),
              config: JSON.stringify({ reviewCriteria: 'correctness,edge_cases,performance' }),
              timeout: 300,
            },
            {
              order: 4,
              name: 'Quality Review',
              roleGroup: 'Контроль',
              action: 'review',
              inputSchema: JSON.stringify({ type: 'object', properties: { code: { type: 'string' }, testResults: { type: 'object' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { approved: { type: 'boolean' }, reviewNotes: { type: 'string' } } }),
              config: JSON.stringify({ reviewCriteria: 'architecture,security,maintainability', strictness: 'high' }),
              timeout: 180,
            },
            {
              order: 5,
              name: 'Store & Index',
              roleGroup: 'Память',
              action: 'transform',
              inputSchema: JSON.stringify({ type: 'object', properties: { code: { type: 'string' }, reviewNotes: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { archived: { type: 'boolean' }, indexId: { type: 'string' } } }),
              config: JSON.stringify({ transformType: 'archive_index' }),
              timeout: 120,
            },
            {
              order: 6,
              name: 'Notify Completion',
              roleGroup: 'Коммуникация',
              action: 'broadcast',
              inputSchema: JSON.stringify({ type: 'object', properties: { archived: { type: 'boolean' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { notified: { type: 'boolean' } } }),
              config: JSON.stringify({ channels: ['team', 'dashboard'] }),
              timeout: 60,
            },
          ],
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    // ─── Workflow 2: Analysis & Reporting Pipeline ────────────────────────
    const analysisPipeline = await db.workflow.create({
      data: {
        name: 'Analysis & Reporting',
        description: 'Аналитический конвейер: сбор данных → анализ → оценка → отчёт',
        status: 'active',
        triggerType: 'schedule',
        triggerConfig: JSON.stringify({ cron: '0 9 * * *', timezone: 'Europe/Moscow' }),
        tags: 'analysis,reporting,scheduled',
        steps: {
          create: [
            {
              order: 0,
              name: 'Gather Data',
              roleGroup: 'Память',
              action: 'process',
              inputSchema: JSON.stringify({ type: 'object', properties: { query: { type: 'string' }, sources: { type: 'array' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { rawData: { type: 'array' }, sourceCount: { type: 'number' } } }),
              config: JSON.stringify({ promptTemplate: 'Retrieve relevant data from knowledge base' }),
              timeout: 300,
            },
            {
              order: 1,
              name: 'Analyze',
              roleGroup: 'Стратегия',
              action: 'transform',
              inputSchema: JSON.stringify({ type: 'object', properties: { rawData: { type: 'array' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { analysis: { type: 'object' }, insights: { type: 'array' } } }),
              config: JSON.stringify({ transformType: 'analyze', promptTemplate: 'Perform deep analysis on gathered data' }),
              timeout: 600,
            },
            {
              order: 2,
              name: 'Evaluate Quality',
              roleGroup: 'Контроль',
              action: 'review',
              inputSchema: JSON.stringify({ type: 'object', properties: { analysis: { type: 'object' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { qualityScore: { type: 'number' }, issues: { type: 'array' } } }),
              config: JSON.stringify({ reviewCriteria: 'accuracy,completeness,relevance' }),
              timeout: 180,
            },
            {
              order: 3,
              name: 'Generate Report',
              roleGroup: 'Исполнение',
              action: 'transform',
              inputSchema: JSON.stringify({ type: 'object', properties: { analysis: { type: 'object' }, qualityScore: { type: 'number' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { report: { type: 'string' }, format: { type: 'string' } } }),
              config: JSON.stringify({ transformType: 'format_report' }),
              timeout: 300,
            },
            {
              order: 4,
              name: 'Distribute Report',
              roleGroup: 'Коммуникация',
              action: 'broadcast',
              config: JSON.stringify({ channels: ['stakeholders', 'dashboard', 'archive'] }),
              timeout: 60,
            },
          ],
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    // ─── Workflow 3: Incident Response ────────────────────────────────────
    // Monitoring alert → Diagnosis → Decision → Fix → Verify → Learn
    const incidentPipeline = await db.workflow.create({
      data: {
        name: 'Incident Response',
        description: 'Реагирование на инциденты: алерт → диагностика → решение → проверка → обучение',
        status: 'active',
        triggerType: 'event',
        triggerConfig: JSON.stringify({ eventPattern: 'alert:*', severity: 'critical' }),
        tags: 'incident,response,critical,monitoring',
        steps: {
          create: [
            {
              order: 0,
              name: 'Detect Incident',
              roleGroup: 'Мониторинг',
              action: 'process',
              inputSchema: JSON.stringify({ type: 'object', properties: { alertType: { type: 'string' }, severity: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { incidentId: { type: 'string' }, classification: { type: 'string' } } }),
              config: JSON.stringify({ promptTemplate: 'Classify and triage incoming alert' }),
              timeout: 60,
            },
            {
              order: 1,
              name: 'Diagnose',
              roleGroup: 'Мониторинг',
              action: 'transform',
              inputSchema: JSON.stringify({ type: 'object', properties: { incidentId: { type: 'string' }, classification: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { rootCause: { type: 'string' }, affectedComponents: { type: 'array' } } }),
              config: JSON.stringify({ transformType: 'diagnose' }),
              timeout: 180,
            },
            {
              order: 2,
              name: 'Decide Action',
              roleGroup: 'Стратегия',
              action: 'decision',
              inputSchema: JSON.stringify({ type: 'object', properties: { rootCause: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { action: { type: 'string' }, priority: { type: 'string' } } }),
              condition: JSON.stringify({ field: 'severity', operator: 'eq', value: 'critical' }),
              config: JSON.stringify({ condition: 'quality_check' }),
              timeout: 60,
            },
            {
              order: 3,
              name: 'Execute Fix',
              roleGroup: 'Исполнение',
              action: 'process',
              inputSchema: JSON.stringify({ type: 'object', properties: { action: { type: 'string' }, rootCause: { type: 'string' } } }),
              outputSchema: JSON.stringify({ type: 'object', properties: { fixApplied: { type: 'boolean' }, changes: { type: 'array' } } }),
              config: JSON.stringify({ promptTemplate: 'Apply fix based on diagnosis' }),
              timeout: 300,
            },
            {
              order: 4,
              name: 'Verify Fix',
              roleGroup: 'Контроль',
              action: 'review',
              config: JSON.stringify({ reviewCriteria: 'fix_verified,no_regression,performance_ok' }),
              timeout: 180,
            },
            {
              order: 5,
              name: 'Learn & Adapt',
              roleGroup: 'Обучение',
              action: 'transform',
              config: JSON.stringify({ transformType: 'learn', promptTemplate: 'Extract lessons from incident' }),
              timeout: 120,
            },
          ],
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    // ─── Workflow 4: Knowledge Update Pipeline ────────────────────────────
    const knowledgePipeline = await db.workflow.create({
      data: {
        name: 'Knowledge Update',
        description: 'Обновление знаний: поиск → верификация → индексация → распространение',
        status: 'active',
        triggerType: 'webhook',
        triggerConfig: JSON.stringify({ url: '/api/webhooks/knowledge-update' }),
        tags: 'knowledge,memory,rag,update',
        steps: {
          create: [
            {
              order: 0,
              name: 'Retrieve Knowledge',
              roleGroup: 'Память',
              action: 'process',
              config: JSON.stringify({ promptTemplate: 'Search and retrieve relevant knowledge' }),
              timeout: 300,
            },
            {
              order: 1,
              name: 'Verify Accuracy',
              roleGroup: 'Контроль',
              action: 'review',
              config: JSON.stringify({ reviewCriteria: 'factual_accuracy,source_reliability,recency' }),
              timeout: 180,
            },
            {
              order: 2,
              name: 'Index & Store',
              roleGroup: 'Память',
              action: 'transform',
              config: JSON.stringify({ transformType: 'index_embed' }),
              timeout: 120,
            },
            {
              order: 3,
              name: 'Propagate Updates',
              roleGroup: 'Коммуникация',
              action: 'broadcast',
              config: JSON.stringify({ channels: ['agents', 'dashboard', 'knowledge_graph'] }),
              timeout: 60,
            },
          ],
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    // ─── Workflow 5: Agent Coordination (decision-heavy) ──────────────────
    const coordPipeline = await db.workflow.create({
      data: {
        name: 'Agent Coordination',
        description: 'Координация агентов: запрос → маршрутизация → делегирование → агрегация',
        status: 'draft',
        triggerType: 'agent',
        triggerConfig: JSON.stringify({ sourceAgent: 'any', condition: 'needs_coordination' }),
        tags: 'coordination,delegation,routing',
        steps: {
          create: [
            {
              order: 0,
              name: 'Classify Request',
              roleGroup: 'Стратегия',
              action: 'decision',
              config: JSON.stringify({ condition: 'task_type', branches: ['coding', 'analysis', 'quality', 'general'] }),
              timeout: 60,
            },
            {
              order: 1,
              name: 'Route to Team',
              roleGroup: 'Тактика',
              action: 'delegate',
              config: JSON.stringify({ routingRules: { coding: 'Исполнение', analysis: 'Стратегия', quality: 'Контроль', general: 'Исполнение' } }),
              timeout: 60,
            },
            {
              order: 2,
              name: 'Execute Task',
              roleGroup: 'Исполнение',
              action: 'process',
              config: JSON.stringify({ promptTemplate: 'Execute assigned task' }),
              timeout: 600,
            },
            {
              order: 3,
              name: 'Aggregate Results',
              roleGroup: 'Тактика',
              action: 'transform',
              config: JSON.stringify({ transformType: 'aggregate' }),
              timeout: 120,
            },
          ],
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({
      seeded: true,
      workflows: [
        { id: devPipeline.id, name: devPipeline.name, steps: devPipeline.steps.length },
        { id: analysisPipeline.id, name: analysisPipeline.name, steps: analysisPipeline.steps.length },
        { id: incidentPipeline.id, name: incidentPipeline.name, steps: incidentPipeline.steps.length },
        { id: knowledgePipeline.id, name: knowledgePipeline.name, steps: knowledgePipeline.steps.length },
        { id: coordPipeline.id, name: coordPipeline.name, steps: coordPipeline.steps.length },
      ],
    })
  } catch (error: any) {
    console.error('[/api/workflows/seed POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
