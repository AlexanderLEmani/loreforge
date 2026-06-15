import { GUILD_QUEST_GOLD } from '@/lib/economy'

export type GuildQuest = {
  id: string
  title: string
  desc: string
  prog: number
  total: number
  glory: number
  gold: number
  color: string
  done: boolean
  claimed?: boolean
}

type RunRow = {
  result: string
  mistakes?: string[] | null
  dungeon_name?: string | null
  created_at?: string
  was_champion?: boolean | null
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
  const championWinToday = todayRuns.some(
    r => r.result === 'win' && r.was_champion,
  )

  return [
    {
      id: 'champion',
      title: 'Победи чемпиона',
      desc: 'Победа против чемпиона данжа сегодня. Чемпионы появляются случайно.',
      prog: championWinToday ? 1 : 0,
      total: 1,
      glory: 100,
      gold: GUILD_QUEST_GOLD.champion,
      color: '#e05555',
      done: championWinToday,
    },
    {
      id: 'wins',
      title: '3 победы сегодня',
      desc: 'Любые данжи. Считаются только победы за сегодня.',
      prog: Math.min(winsToday, 3),
      total: 3,
      glory: 80,
      gold: GUILD_QUEST_GOLD.wins,
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
      gold: GUILD_QUEST_GOLD.perfect,
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
      gold: GUILD_QUEST_GOLD.daily,
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
      gold: GUILD_QUEST_GOLD.spells,
      color: '#7b6cff',
      done: spellKills >= 5,
    },
  ]
}

export function todayIso() {
  return new Date().toISOString().split('T')[0]
}
