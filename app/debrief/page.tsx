'use client'

import { createClient } from '@/lib/supabase'
import { tryGrantDungeonLoot, type LootDrop } from '@/lib/dungeon-loot'
import { itemById } from '@/lib/equipment'
import EquipmentCard from '@/components/EquipmentCard'
import { battleDebriefRewards } from '@/lib/economy'
import { applyRaceXp } from '@/lib/race-bonuses'
import { grantGlory } from '@/lib/glory-wallet'
import { syncQuestRewards } from '@/lib/quest-rewards'
import { syncGuildRankRewards } from '@/lib/guild-rank-rewards'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function DebriefContent() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [saved, setSaved] = useState(false)
  const [characterName, setCharacterName] = useState('Аркан')
  const [lootDrop, setLootDrop] = useState<LootDrop | null>(null)
  const [playerRace, setPlayerRace] = useState('human')
  const result = params.get('result')
  const score = params.get('score') || '0'
  const total = params.get('total') || '5'
  const mistakesRaw = params.get('mistakes') || ''
  const dungeonName = params.get('dungeon') || 'Данж'
  const isHard = params.get('hard') === 'true'
  const spellKill = params.get('spell') === '1'
  const mistakes = mistakesRaw ? decodeURIComponent(mistakesRaw).split('|').filter(Boolean) : []
  const pct = Math.round((parseInt(score) / parseInt(total)) * 100)
  const scoreNum = parseInt(score)
  const won = result === 'win'
  const rewards = battleDebriefRewards(scoreNum, won, isHard, dungeonName)
  const xpDisplay = applyRaceXp(rewards.xpGained, playerRace, spellKill && won ? 'spell' : 'all')

  useEffect(() => {
    async function saveRun() {
      if (saved) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ch } = await supabase.from('characters').select('name, race').eq('user_id', user.id).single()
      if (ch) {
        setCharacterName(ch.name)
        if (ch.race) setPlayerRace(ch.race)
      }

      await supabase.from('dungeon_runs').insert({
        user_id: user.id,
        dungeon_name: dungeonName,
        score: parseInt(score),
        total: parseInt(total),
        result: result || 'win',
        mistakes: mistakes,
      })

      const { xpGained: baseXp, goldGained, gloryGained } = rewards
      const race = ch?.race ?? 'human'
      const xpGained = applyRaceXp(baseXp, race, spellKill && won ? 'spell' : 'all')

      const lootKey = `loot:${user.id}:${dungeonName}:${score}:${total}:${result}:${isHard}`
      let loot: LootDrop | null = null
      if (won && !sessionStorage.getItem(lootKey)) {
        loot = await tryGrantDungeonLoot(supabase, user.id, dungeonName, true)
        if (loot) {
          sessionStorage.setItem(lootKey, JSON.stringify(loot))
          setLootDrop(loot)
        }
      } else if (won) {
        try {
          const cached = sessionStorage.getItem(lootKey)
          if (cached) setLootDrop(JSON.parse(cached))
        } catch { /* ignore */ }
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('xp, level, gold, glory, quest_first_dungeon')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.warn('debrief user load failed:', userError.message)
      }

      if (userData) {
        const newXP = (userData.xp ?? 0) + xpGained
        const lootGold = loot?.kind === 'gold' ? loot.gold ?? 0 : 0
        const newGold = (userData.gold ?? 0) + goldGained + lootGold

        const { error: rewardError } = await supabase
          .from('users')
          .update({ xp: newXP, gold: newGold })
          .eq('id', user.id)

        if (rewardError) {
          console.warn('debrief rewards failed:', rewardError.message)
        }

        if (gloryGained > 0) {
          await grantGlory(supabase, user.id, gloryGained)
          await syncGuildRankRewards(supabase, user.id)
        }

        if (spellKill && result === 'win') {
          const { data: sk } = await supabase.from('users').select('spell_kills').eq('id', user.id).single()
          if (!sk) {
            await supabase.from('users').update({ spell_kills: 1 }).eq('id', user.id)
          } else if (sk.spell_kills != null) {
            await supabase.from('users').update({ spell_kills: (sk.spell_kills ?? 0) + 1 }).eq('id', user.id)
          }
        }

        if (!userData.quest_first_dungeon && result === 'win') {
          await supabase.from('users').update({ quest_first_dungeon: true }).eq('id', user.id)
        }
      }

      await syncQuestRewards(supabase, user.id)
      setSaved(true)
    }
    saveRun()
  }, [])

  const ctaLabel = won
    ? (pct >= 80 ? '🎉 Отлично! В гильдию' : '✓ Понял, в гильдию')
    : 'Ок, назад в гильдию'

  return (
    <div className="lf-debrief-shell" style={{ background: '#0b0c10', fontFamily: 'serif' }}>
      <div className="lf-debrief-panel">

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{won ? '🏆' : '💀'}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '6px' }}>
            {characterName} · {dungeonName}
          </div>
          <div style={{ fontFamily: 'serif', fontSize: '26px', color: won ? '#e0bc6a' : '#e05555', marginBottom: '4px' }}>
            {won ? 'Данж пройден' : 'Не в этот раз'}
          </div>
          <div style={{ fontSize: '15px', color: '#9590a8' }}>
            {score} / {total} · {pct}%
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.25)', borderRadius: '8px', padding: '10px 14px', textAlign: 'center', minWidth: '72px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#3db87a' }}>+{xpDisplay}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670' }}>XP</div>
          </div>
          {won && (
            <>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '8px', padding: '10px 14px', textAlign: 'center', minWidth: '72px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e0bc6a' }}>+{rewards.goldGained}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670' }}>💰</div>
              </div>
              <div style={{ background: 'rgba(123,108,255,0.08)', border: '1px solid rgba(123,108,255,0.25)', borderRadius: '8px', padding: '10px 14px', textAlign: 'center', minWidth: '72px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#a99fff' }}>+{rewards.gloryGained}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670' }}>⭐</div>
              </div>
            </>
          )}
          {lootDrop && lootDrop.kind === 'equipment' && lootDrop.equipmentId && itemById(lootDrop.equipmentId) ? (
            <div style={{ minWidth: '200px', maxWidth: '280px' }}>
              <EquipmentCard item={itemById(lootDrop.equipmentId)!} action="none" compact />
            </div>
          ) : lootDrop ? (
            <div style={{ background: 'rgba(169,159,255,0.1)', border: '1px solid rgba(169,159,255,0.35)', borderRadius: '8px', padding: '10px 14px', textAlign: 'center', minWidth: '88px' }}>
              <div style={{ fontSize: '20px' }}>{lootDrop.icon}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#c8c0d8', marginTop: '2px' }}>{lootDrop.label}</div>
            </div>
          ) : null}
        </div>

        {mistakes.length > 0 && (
          <div className="lf-debrief-mistakes" style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 14px', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5a5670', letterSpacing: '0.12em', marginBottom: '8px' }}>ОШИБКИ</div>
            {mistakes.map((m, i) => (
              <div key={i} style={{ fontSize: '14px', color: '#c8c0d8', padding: '4px 0', borderBottom: i < mistakes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                {m}
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: '13px', color: '#9590a8', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          {won
            ? (pct >= 80 ? 'Чистая работа. Гильдия ждёт следующий данж.' : 'Неплохо. При необходимости — тренировка по свитку.')
            : 'Ошибки — карта пробелов. Тренировка или свиток, потом снова в данж.'}
        </div>

        <button type="button" className="lf-debrief-cta" onClick={() => router.push('/guild')}>
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}

export default function Debrief() {
  return (
    <Suspense>
      <DebriefContent />
    </Suspense>
  )
}
