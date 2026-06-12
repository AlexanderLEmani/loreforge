export type GuildQuest = {
  id: string
  title: string
  desc: string
  prog: number
  total: number
  glory: number
  color: string
  done: boolean
}

type RunRow = {
  result: string
  mistakes?: string[] | null
  dungeon_name?: string | null
  created_at?: string
}

function isToday(ts?: string): boolean {
  if (!ts) return false
  return ts.startsWith(todayIso())
}

export function buildGuildQuests(
  runs: RunRow[],
  answersToday: number,
  spellKills: number,
): GuildQuest[] {
  const todayRuns = runs.filter(r => isToday(r.created_at))
  const winsToday = todayRuns.filter(r => r.result === 'win').length
  const perfectToday = todayRuns.some(
    r => r.result === 'win' && (!r.mistakes || r.mistakes.length === 0),
  )

  return [
    {
      id: 'wins',
      title: '3 победы сегодня',
      desc: 'Любые данжи. Считаются только победы за сегодня.',
      prog: Math.min(winsToday, 3),
      total: 3,
      glory: 80,
      color: '#a99fff',
      done: winsToday >= 3,
    },
    {
      id: 'perfect',
      title: 'Пройти данж без ошибок',
      desc: 'Ни одного неверного ответа в забеге.',
      prog: perfectToday ? 1 : 0,
      total: 1,
      glory: 150,
      color: '#e0bc6a',
      done: perfectToday,
    },
    {
      id: 'daily',
      title: 'Ответить на 20 вопросов сегодня',
      desc: 'Бой, тренировка, экзамен — всё считается.',
      prog: Math.min(answersToday, 20),
      total: 20,
      glory: 50,
      color: '#3db87a',
      done: answersToday >= 20,
    },
    {
      id: 'spells',
      title: '5 убийств заклинанием',
      desc: 'Победи монстра финальным ударом комбо-заклинания.',
      prog: Math.min(spellKills, 5),
      total: 5,
      glory: 60,
      color: '#7b6cff',
      done: spellKills >= 5,
    },
  ]
}

export function todayIso() {
  return new Date().toISOString().split('T')[0]
}
