import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const sampleAgents = [
  // Стратегия (Strategy)
  { name: 'Архитектор', role: 'Chief Strategy Agent', roleGroup: 'Стратегия', status: 'active', formula: 'ToT', skills: 'планирование,архитектура,стратегия', description: 'Главный стратегический агент, формулирует цели и пути их достижения', avatar: 'building-2' },
  { name: 'Аналитик', role: 'Strategy Analyst', roleGroup: 'Стратегия', status: 'active', formula: 'CoVe', skills: 'анализ,прогнозирование,моделирование', description: 'Анализирует входные данные и формирует стратегические рекомендации', avatar: 'bar-chart-3' },
  { name: 'Визионер', role: 'Vision Agent', roleGroup: 'Стратегия', status: 'active', formula: 'ToT', skills: 'креативность,визионерство,инновации', description: 'Генерирует долгосрочные видения и творческие решения', avatar: 'sparkles' },

  // Тактика (Tactics)
  { name: 'Координатор', role: 'Tactical Coordinator', roleGroup: 'Тактика', status: 'active', formula: 'ReWOO', skills: 'координация,делегирование,управление', description: 'Координирует работу тактической группы и распределяет задачи', avatar: 'target' },
  { name: 'Планировщик', role: 'Task Planner', roleGroup: 'Тактика', status: 'active', formula: 'ReAct', skills: 'планирование,оценка,приоритизация', description: 'Разбивает стратегические цели на конкретные задачи', avatar: 'clipboard-list' },
  { name: 'Коммуникатор', role: 'Inter-Agent Comm', roleGroup: 'Тактика', status: 'idle', formula: 'Reflexion', skills: 'коммуникация,синхронизация,передача', description: 'Обеспечивает коммуникацию между агентами и группами', avatar: 'radio' },

  // Контроль (Control)
  { name: 'Ревизор', role: 'Quality Controller', roleGroup: 'Контроль', status: 'active', formula: 'Reflexion', skills: 'проверка,валидация,контроль_качества', description: 'Контролирует качество выполнения задач и соответствие стандартам', avatar: 'search' },
  { name: 'Оценщик', role: 'Performance Evaluator', roleGroup: 'Контроль', status: 'active', formula: 'CoVe', skills: 'оценка,метрики,отчётность', description: 'Оценивает производительность агентов и качество результатов', avatar: 'trending-up' },
  { name: 'Страж', role: 'Safety Guard', roleGroup: 'Контроль', status: 'active', formula: 'ReAct', skills: 'безопасность,фильтрация,защита', description: 'Обеспечивает безопасность и предотвращает нежелательные действия', avatar: 'shield-check' },

  // Исполнение (Execution)
  { name: 'Исполнитель-A', role: 'Primary Executor', roleGroup: 'Исполнение', status: 'active', formula: 'ReAct', skills: 'выполнение,кодирование,генерация', description: 'Основной исполнительный агент для генерации контента и кода', avatar: 'zap' },
  { name: 'Исполнитель-B', role: 'Secondary Executor', roleGroup: 'Исполнение', status: 'active', formula: 'MoA', skills: 'выполнение,анализ,обработка', description: 'Второй исполнительный агент, работает в связке с Исполнитель-A', avatar: 'flame' },
  { name: 'Отладчик', role: 'Debug Agent', roleGroup: 'Исполнение', status: 'idle', formula: 'Reflexion', skills: 'отладка,исправление,оптимизация', description: 'Исправляет ошибки и оптимизирует результаты других исполнителей', avatar: 'bug' },
  { name: 'Тестировщик', role: 'Test Agent', roleGroup: 'Исполнение', status: 'active', formula: 'ReWOO', skills: 'тестирование,верификация,валидация', description: 'Тестирует результаты работы и верифицирует корректность', avatar: 'check-circle' },
]

export async function POST() {
  try {
    // Delete existing data to allow re-seed with updated avatar values
    await db.task.deleteMany()
    await db.agent.deleteMany()

    // Create agents
    const created = []
    for (const agent of sampleAgents) {
      const record = await db.agent.create({ data: agent })
      created.push(record)
    }

    // Set up hierarchy relationships
    // Архитектор is parent of Аналитик and Визионер
    if (created[0] && created[1]) {
      await db.agent.update({ where: { id: created[1].id }, data: { parentId: created[0].id } })
    }
    if (created[0] && created[2]) {
      await db.agent.update({ where: { id: created[2].id }, data: { parentId: created[0].id } })
    }
    // Координатор is parent of Планировщик and Коммуникатор
    if (created[3] && created[4]) {
      await db.agent.update({ where: { id: created[4].id }, data: { parentId: created[3].id } })
    }
    if (created[3] && created[5]) {
      await db.agent.update({ where: { id: created[5].id }, data: { parentId: created[3].id } })
    }
    // Исполнитель-A twin of Исполнитель-B
    if (created[9] && created[10]) {
      await db.agent.update({ where: { id: created[9].id }, data: { twinId: created[10].id } })
      await db.agent.update({ where: { id: created[10].id }, data: { twinId: created[9].id } })
    }

    return NextResponse.json({ message: 'Agents seeded successfully', count: created.length })
  } catch (error) {
    console.error('Failed to seed agents:', error)
    return NextResponse.json({ error: 'Failed to seed agents' }, { status: 500 })
  }
}
