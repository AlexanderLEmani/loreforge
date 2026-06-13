import { HUB_QUEST_REWARDS, formatQuestReward } from '@/lib/economy'
import { todayIso } from '@/lib/guild-quests'
import { DAILY_STUDY_TARGET_SECONDS } from '@/lib/daily-study'

export type DailyQuest = {
  id: string
  title: string
  prog: number
  total: number
  reward: string
  done: boolean
  claimed?: boolean
}

type RunRow = { result: string; created_at?: string }

export function buildHubDailyQuests(
  answersToday: number,
  runsToday: RunRow[],
  studySecondsToday: number,
): DailyQuest[] {
  const winsToday = runsToday.filter(r => r.result === 'win').length
  const studyMinutes = Math.floor(DAILY_STUDY_TARGET_SECONDS / 60)
  const studyDone = studySecondsToday >= DAILY_STUDY_TARGET_SECONDS

  return [
    {
      id: 'study',
      title: `${studyMinutes} минут практики сегодня`,
      prog: Math.min(studySecondsToday, DAILY_STUDY_TARGET_SECONDS),
      total: DAILY_STUDY_TARGET_SECONDS,
      reward: formatQuestReward(HUB_QUEST_REWARDS.login.xp, HUB_QUEST_REWARDS.login.gold),
      done: studyDone,
    },
    {
      id: 'answers',
      title: 'Ответить на 10 вопросов сегодня',
      prog: Math.min(answersToday, 10),
      total: 10,
      reward: formatQuestReward(HUB_QUEST_REWARDS.answers.xp, HUB_QUEST_REWARDS.answers.gold),
      done: answersToday >= 10,
    },
    {
      id: 'dungeon',
      title: 'Победить в данже сегодня',
      prog: Math.min(winsToday, 1),
      total: 1,
      reward: formatQuestReward(HUB_QUEST_REWARDS.dungeon.xp, HUB_QUEST_REWARDS.dungeon.gold),
      done: winsToday >= 1,
    },
  ]
}

export function isToday(ts?: string): boolean {
  if (!ts) return false
  return ts.startsWith(todayIso())
}
