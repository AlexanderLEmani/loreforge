import { todayIso } from '@/lib/guild-quests'

export type DailyQuest = {
  id: string
  title: string
  prog: number
  total: number
  reward: string
  done: boolean
}

type RunRow = { result: string; created_at?: string }

export function buildHubDailyQuests(
  answersToday: number,
  runsToday: RunRow[],
  lastVisit?: string,
): DailyQuest[] {
  const winsToday = runsToday.filter(r => r.result === 'win').length
  const playedToday = runsToday.length > 0
  const today = todayIso()
  const loginDone = lastVisit === today || playedToday

  return [
    {
      id: 'login',
      title: 'Войти в игру',
      prog: loginDone ? 1 : 0,
      total: 1,
      reward: '+10 XP',
      done: loginDone,
    },
    {
      id: 'answers',
      title: 'Ответить на 10 вопросов сегодня',
      prog: Math.min(answersToday, 10),
      total: 10,
      reward: '+30 XP',
      done: answersToday >= 10,
    },
    {
      id: 'dungeon',
      title: 'Победить в данже сегодня',
      prog: Math.min(winsToday, 1),
      total: 1,
      reward: '+50 XP',
      done: winsToday >= 1,
    },
  ]
}

export function isToday(ts?: string): boolean {
  if (!ts) return false
  return ts.startsWith(todayIso())
}
