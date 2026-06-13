'use client'

import { createClient } from '@/lib/supabase'
import { tryGrantDungeonLoot, type LootDrop } from '@/lib/dungeon-loot'
import { battleDebriefRewards } from '@/lib/economy'
import { grantGlory } from '@/lib/glory-wallet'
import { syncQuestRewards } from '@/lib/quest-rewards'
import { syncGuildRankRewards } from '@/lib/guild-rank-rewards'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { layout } from '@/lib/layout-classes'

function DebriefContent() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [saved, setSaved] = useState(false)
  const [characterName, setCharacterName] = useState('Аркан')
  const [lootDrop, setLootDrop] = useState<LootDrop | null>(null)
  const result = params.get('result') // 'win' or 'lose'
  const score = params.get('score') || '0'
  const total = params.get('total') || '5'
  const mistakesRaw = params.get('mistakes') || ''
  const dungeonName = params.get('dungeon') || 'Данж'
  const isHard = params.get('hard') === 'true'
  const spellKill = params.get('spell') === '1'
  const mistakes = mistakesRaw ? decodeURIComponent(mistakesRaw).split('|') : []
  const pct = Math.round((parseInt(score) / parseInt(total)) * 100)
  const scoreNum = parseInt(score)
  const won = result === 'win'
  const rewards = battleDebriefRewards(scoreNum, won, isHard, dungeonName)
  useEffect(() => {
    async function saveRun() {
  if (saved) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: ch } = await supabase.from('characters').select('name').eq('user_id', user.id).single()
  if (ch) setCharacterName(ch.name)
  
  // Сохраняем прохождение
  await supabase.from('dungeon_runs').insert({
    user_id: user.id,
    dungeon_name: dungeonName,
    score: parseInt(score),
    total: parseInt(total),
    result: result || 'win',
    mistakes: mistakes,
  })

  const { xpGained, goldGained, gloryGained } = rewards

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
    const thresholds = [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400, 6500]
    const level = userData.level || 1
    const currentThreshold = thresholds[level - 1] || 0
    const xpInLevel = (userData.xp ?? 0) - currentThreshold
    const newXP = currentThreshold + xpInLevel + xpGained
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

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.25em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '8px' }}>
             {characterName} · {dungeonName}

          </div>
          <div style={{ fontFamily: 'serif', fontSize: '40px', color: '#e0bc6a', marginBottom: '6px' }}>Разбор похода</div>
          <div style={{ fontSize: '17px', color: '#9590a8', fontStyle: 'italic' }}>
            Ошибки — это карта пробелов. Изучи внимательно.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
  {result === 'win' ? (
    <>
      <div style={{ background: 'rgba(61,184,122,0.08)', border: '1px solid rgba(61,184,122,0.3)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#3db87a' }}>+{rewards.xpGained}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>XP</div>
      </div>
      <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#e0bc6a' }}>+{rewards.goldGained}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>💰 Золото</div>
      </div>
      <div style={{ background: 'rgba(123,108,255,0.08)', border: '1px solid rgba(123,108,255,0.3)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#a99fff' }}>+{rewards.gloryGained}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>⭐ Слава</div>
      </div>
      {isHard && (
        <div style={{ background: 'rgba(224,188,106,0.08)', border: '1px solid rgba(224,188,106,0.3)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#e0bc6a' }}>x2</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>⚡ Хард бонус</div>
        </div>
      )}
      {lootDrop && (
        <div style={{ background: 'rgba(169,159,255,0.1)', border: '1px solid rgba(169,159,255,0.35)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '120px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#a99fff' }}>{lootDrop.icon}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#c8c0d8', marginTop: '3px', lineHeight: 1.3 }}>
            {lootDrop.kind === 'scroll' ? 'Свиток' : lootDrop.kind === 'consumable' ? 'Расходник' : lootDrop.kind === 'equipment' ? 'Снаряжение' : 'Дроп'}
            <br />{lootDrop.label}
          </div>
        </div>
      )}
    </>
  ) : (
    <>
      <div style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#e05555' }}>+{rewards.xpGained}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>XP (урезано)</div>
      </div>
      <div style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#e05555' }}>0</div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>⭐ Слава</div>
      </div>
      <div style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '22px', color: '#e05555' }}>💀</div>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5670', marginTop: '3px' }}>Провал</div>
      </div>
    </>
  )}
</div>
        </div>

        {/* Результат + ошибки */}
        <div className={layout.stack2} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

          {/* Результат */}
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.11), transparent)' }}></div>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e0bc6a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Результат</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'serif', fontSize: '52px', color: '#e6e2f0', lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: '22px', color: '#5a5670' }}>/ {total}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#e0bc6a', padding: '3px 9px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '4px', background: 'rgba(201,168,76,0.12)' }}>{pct}%</div>
            </div>
            <div style={{ height: '5px', background: '#171920', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ height: '100%', background: pct >= 70 ? '#2dd9b8' : '#e05555', borderRadius: '3px', width: `${pct}%`, transition: 'width 0.5s' }}></div>
            </div>
            <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic' }}>
              {pct >= 80 ? 'Отличный результат!' : pct >= 60 ? 'Хороший результат. Есть что улучшить.' : 'Нужно повторить материал.'}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <div style={{ background: 'rgba(45,217,184,0.1)', border: '1px solid rgba(45,217,184,0.2)', borderRadius: '6px', padding: '8px 12px', textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#2dd9b8' }}>{score}</div>
                <div style={{ fontSize: '11px', color: '#5a5670', marginTop: '2px' }}>верных</div>
              </div>
              <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '6px', padding: '8px 12px', textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '18px', color: '#e05555' }}>{parseInt(total) - parseInt(score)}</div>
                <div style={{ fontSize: '11px', color: '#5a5670', marginTop: '2px' }}>ошибок</div>
              </div>
            </div>
          </div>

          {/* Ошибки */}
          <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e0bc6a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Разбор ошибок</div>
            {mistakes.length === 0 ? (
              <div style={{ fontSize: '15px', color: '#2dd9b8', fontStyle: 'italic' }}>Ошибок нет. Отличная работа!</div>
            ) : mistakes.map((m, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontFamily: 'serif', fontSize: '20px', color: '#e6e2f0', marginBottom: '4px' }}>{m}</div>
                <div style={{ display: 'flex', gap: '14px', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#e05555' }}>Неверный ответ</span>
                </div>
                <div style={{ fontSize: '12px', color: '#5a5670', fontStyle: 'italic' }}>Повтори эту тему в Гримуаре</div>
              </div>
            ))}
          </div>
        </div>

        {/* Магистр */}
        <div style={{ background: '#1c1f2a', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '56px 1fr', gap: '1.25rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>🧓</div>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: '15px', color: '#e0bc6a', marginBottom: '8px' }}>Анализ от Магистра Гораса</div>
            <div style={{ fontSize: '15px', color: '#9590a8', fontStyle: 'italic', lineHeight: 1.7 }}>
              {pct === 100
                ? '«Превосходно. Ты прошёл без единой ошибки. Переходи к следующему данжу.»'
                : pct >= 80
                ? '«Хорошая работа. Небольшие пробелы есть, но ты на верном пути. Повтори ошибки и иди дальше.»'
                : '«Есть над чем работать. Не спеши — пройди данж ещё раз после повторения теории в Гримуаре.»'
              }
            </div>
            {mistakes.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {mistakes.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '5px 0', fontSize: '13px', color: '#9590a8', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: '#e0bc6a', fontSize: '10px', marginTop: '4px' }}>◆</span>
                    Повтори пример: {m}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => router.push('/battle')} style={{ padding: '12px 32px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '6px', color: '#e0bc6a', fontFamily: 'serif', fontSize: '15px', cursor: 'pointer' }}>
            Повторить данж
          </button>
          <button onClick={() => router.push('/hub')} style={{ padding: '12px 28px', background: 'transparent', border: '1px solid rgba(255,255,255,0.11)', borderRadius: '6px', color: '#9590a8', fontFamily: 'serif', fontSize: '14px', cursor: 'pointer' }}>
            Вернуться в хаб
          </button>
        </div>

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