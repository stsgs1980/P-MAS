import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const sampleAgents = [
  // Strategiya (Strategy)
  { name: 'Arkhitektor', role: 'Chief Strategy Agent', roleGroup: '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f', status: 'active', formula: 'ToT', skills: 'planning,architecture,strategy', description: 'Chief strategic agent that formulates goals and paths to achieve them', avatar: 'building-2' },
  { name: 'Analitik', role: 'Strategy Analyst', roleGroup: '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f', status: 'active', formula: 'CoVe', skills: 'analysis,forecasting,modeling', description: 'Analyzes input data and forms strategic recommendations', avatar: 'bar-chart-3' },
  { name: 'Vizioner', role: 'Vision Agent', roleGroup: '\u0421\u0442\u0440\u0430\u0442\u0435\u0433\u0438\u044f', status: 'active', formula: 'ToT', skills: 'creativity,vision,innovation', description: 'Generates long-term visions and creative solutions', avatar: 'sparkles' },

  // Taktika (Tactics)
  { name: 'Koordinator', role: 'Tactical Coordinator', roleGroup: '\u0422\u0430\u043a\u0442\u0438\u043a\u0430', status: 'active', formula: 'ReWOO', skills: 'coordination,delegation,management', description: 'Coordinates the tactical group and distributes tasks', avatar: 'target' },
  { name: 'Planirovshchik', role: 'Task Planner', roleGroup: '\u0422\u0430\u043a\u0442\u0438\u043a\u0430', status: 'active', formula: 'ReAct', skills: 'planning,estimation,prioritization', description: 'Breaks down strategic goals into concrete tasks', avatar: 'clipboard-list' },
  { name: 'Kommunikator', role: 'Inter-Agent Comm', roleGroup: '\u0422\u0430\u043a\u0442\u0438\u043a\u0430', status: 'idle', formula: 'Reflexion', skills: 'communication,synchronization,transfer', description: 'Ensures communication between agents and groups', avatar: 'radio' },

  // Kontrol (Control)
  { name: 'Revizor', role: 'Quality Controller', roleGroup: '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c', status: 'active', formula: 'Reflexion', skills: 'inspection,validation,quality_control', description: 'Controls task execution quality and standard compliance', avatar: 'search' },
  { name: 'Ocenshchik', role: 'Performance Evaluator', roleGroup: '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c', status: 'active', formula: 'CoVe', skills: 'evaluation,metrics,reporting', description: 'Evaluates agent performance and result quality', avatar: 'trending-up' },
  { name: 'Strazh', role: 'Safety Guard', roleGroup: '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c', status: 'active', formula: 'ReAct', skills: 'security,filtering,protection', description: 'Ensures security and prevents undesirable actions', avatar: 'shield-check' },

  // Ispolnenie (Execution)
  { name: 'Ispolnitel-A', role: 'Primary Executor', roleGroup: '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435', status: 'active', formula: 'ReAct', skills: 'execution,coding,generation', description: 'Primary execution agent for content and code generation', avatar: 'zap' },
  { name: 'Ispolnitel-B', role: 'Secondary Executor', roleGroup: '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435', status: 'active', formula: 'MoA', skills: 'execution,analysis,processing', description: 'Secondary execution agent, works in tandem with Ispolnitel-A', avatar: 'flame' },
  { name: 'Otladchik', role: 'Debug Agent', roleGroup: '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435', status: 'idle', formula: 'Reflexion', skills: 'debugging,correction,optimization', description: 'Fixes errors and optimizes results from other executors', avatar: 'bug' },
  { name: 'Testirovshchik', role: 'Test Agent', roleGroup: '\u0418\u0441\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435', status: 'active', formula: 'ReWOO', skills: 'testing,verification,validation', description: 'Tests work results and verifies correctness', avatar: 'check-circle' },
]

const sampleTasks = [
  { title: 'Define Q1 Strategy', description: 'Create comprehensive Q1 strategic plan', status: 'completed', priority: 'high', agentIndex: 0 },
  { title: 'Analyze Market Trends', description: 'Review and analyze current market data', status: 'running', priority: 'high', agentIndex: 1 },
  { title: 'Generate Vision Report', description: 'Draft 3-year vision document', status: 'pending', priority: 'medium', agentIndex: 2 },
  { title: 'Coordinate Sprint Planning', description: 'Organize sprint planning sessions', status: 'running', priority: 'high', agentIndex: 3 },
  { title: 'Create Task Breakdown', description: 'Break down epics into implementable tasks', status: 'completed', priority: 'medium', agentIndex: 4 },
  { title: 'Sync Agent States', description: 'Synchronize state across agent groups', status: 'pending', priority: 'low', agentIndex: 5 },
  { title: 'Review Code Quality', description: 'Audit codebase for quality compliance', status: 'running', priority: 'high', agentIndex: 6 },
  { title: 'Generate Performance Report', description: 'Compile weekly performance metrics', status: 'completed', priority: 'medium', agentIndex: 7 },
  { title: 'Security Audit', description: 'Perform security review of outputs', status: 'running', priority: 'critical', agentIndex: 8 },
  { title: 'Implement Feature A', description: 'Develop feature A according to spec', status: 'running', priority: 'high', agentIndex: 9 },
  { title: 'Process Data Pipeline', description: 'Run data processing pipeline', status: 'completed', priority: 'medium', agentIndex: 10 },
  { title: 'Debug Module X', description: 'Fix reported issues in module X', status: 'pending', priority: 'high', agentIndex: 11 },
  { title: 'Test Integration Suite', description: 'Run integration test suite', status: 'running', priority: 'high', agentIndex: 12 },
  { title: 'Optimize Query Performance', description: 'Improve database query speed', status: 'pending', priority: 'medium', agentIndex: 11 },
  { title: 'Validate API Responses', description: 'Verify API response schemas', status: 'completed', priority: 'low', agentIndex: 12 },
  { title: 'Deploy Staging Build', description: 'Deploy latest build to staging', status: 'running', priority: 'medium', agentIndex: 9 },
]

export async function POST() {
  try {
    // Delete existing data to allow re-seed with updated values
    await db.task.deleteMany()
    await db.agent.deleteMany()

    // Create agents
    const created = []
    for (const agent of sampleAgents) {
      const record = await db.agent.create({ data: agent })
      created.push(record)
    }

    // Set up hierarchy relationships
    // Arkhitektor is parent of Analitik and Vizioner
    if (created[0] && created[1]) {
      await db.agent.update({ where: { id: created[1].id }, data: { parentId: created[0].id } })
    }
    if (created[0] && created[2]) {
      await db.agent.update({ where: { id: created[2].id }, data: { parentId: created[0].id } })
    }
    // Koordinator is parent of Planirovshchik and Kommunikator
    if (created[3] && created[4]) {
      await db.agent.update({ where: { id: created[4].id }, data: { parentId: created[3].id } })
    }
    if (created[3] && created[5]) {
      await db.agent.update({ where: { id: created[5].id }, data: { parentId: created[3].id } })
    }
    // Revizor is parent of Ocenshchik and Strazh
    if (created[6] && created[7]) {
      await db.agent.update({ where: { id: created[7].id }, data: { parentId: created[6].id } })
    }
    if (created[6] && created[8]) {
      await db.agent.update({ where: { id: created[8].id }, data: { parentId: created[6].id } })
    }
    // Ispolnitel-A twin of Ispolnitel-B
    if (created[9] && created[10]) {
      await db.agent.update({ where: { id: created[9].id }, data: { twinId: created[10].id } })
      await db.agent.update({ where: { id: created[10].id }, data: { twinId: created[9].id } })
    }

    // Create sample tasks
    let taskCount = 0
    for (const task of sampleTasks) {
      const agentRecord = created[task.agentIndex]
      if (agentRecord) {
        await db.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            agentId: agentRecord.id,
          },
        })
        taskCount++
      }
    }

    return NextResponse.json({
      message: 'Agents and tasks seeded successfully',
      agentCount: created.length,
      taskCount,
    })
  } catch (error) {
    console.error('Failed to seed agents:', error)
    return NextResponse.json({ error: 'Failed to seed agents' }, { status: 500 })
  }
}
