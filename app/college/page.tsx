'use client'

import { useRouter } from 'next/navigation'

const LECTURE = {
  title: 'Введение в Арифметику',
  subtitle: 'Лекция I — Профессор Горус, Коллегия Магов',
  sections: [
    {
      type: 'intro',
      text: 'Садитесь. Я не буду повторять дважды — последний кто попросил повторить, сейчас удобряет картошку на заднем дворе Академии.',
    },
    {
      type: 'heading',
      text: 'Откуда взялась математика',
    },
    {
      type: 'text',
      text: 'В 2300 году до нашей эры вавилонский торговец Эн-Зу хотел знать сколько баранов он продал и не хотел считать по одному — воняли. Так появилась математика. Запомните: всё великое рождается из лени и запаха.',
    },
    {
      type: 'text',
      text: 'Египтяне строили пирамиды без калькуляторов. Греки доказывали теоремы на песке. Персидские астрономы считали движение звёзд. Все они знали одно: кто умеет считать — тот управляет миром. Кто не умеет — копает канавы для тех кто умеет.',
    },
    {
      type: 'heading',
      text: 'Что математика делает с мозгом',
    },
    {
      type: 'text',
      text: 'Каждый раз когда вы решаете задачу — в мозге формируется новая связь. Не метафорически. Буквально. Нейроны срастаются. Это называется нейропластичность и это единственная магия которая работает по-настоящему.',
    },
    {
      type: 'quote',
      text: '"Числа управляют Вселенной." — Пифагор, примерно 500 лет до н.э., незадолго до того как его ученики основали тайное общество и начали поклоняться треугольникам.',
    },
    {
      type: 'text',
      text: 'Пифагор был странным человеком. Он запрещал есть бобы — считал что в них живут души умерших. Но в математике он разбирался. Его теорема пережила две с половиной тысячи лет и пережёт ещё столько же.',
    },
    {
      type: 'heading',
      text: 'Сложение и вычитание',
    },
    {
      type: 'text',
      text: 'Первые заклинания каждого мага. Примитивные? Да. Бесполезные? Нет. Без сложения нет умножения. Без умножения нет алгебры. Без алгебры нет тригонометрии. Без тригонометрии — нет тёмной магии. Нет тёмной магии — вы просто крестьянин с палкой.',
    },
    {
      type: 'formula',
      text: 'a + b = b + a',
      hint: 'Переместительный закон. Порядок слагаемых не меняет суммы.',
    },
    {
      type: 'formula',
      text: 'a − b ≠ b − a',
      hint: 'А вот с вычитанием так не работает. Запомните это.',
    },
    {
      type: 'text',
      text: 'Именно здесь большинство магов делают первую ошибку. Они думают что математика симметрична. Она не симметрична. Она жестокая, точная и не прощает небрежности. Как я.',
    },
    {
      type: 'outro',
      text: 'На этом первая лекция окончена. Идите в данж. Убейте что-нибудь с помощью сложения. Вернитесь живыми. Тогда поговорим об умножении.',
    },
  ]
}

export default function CollegePage() {
  const router = useRouter()

  return (
    <div style={{ background: '#0b0c10', minHeight: '100vh', fontFamily: 'serif' }}>

      {/* НАВБАР */}
      <nav style={{ height: '56px', background: 'rgba(11,12,16,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '16px', color: '#e0bc6a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', border: '1.5px solid #c9a84c', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✦</div>
          LoreForge
        </div>
        <div onClick={() => router.push('/hub')} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5670', cursor: 'pointer' }}>
          ← В хаб
        </div>
      </nav>

      {/* ШАПКА */}
      <div style={{ background: 'linear-gradient(180deg, #1a1025 0%, #0b0c10 100%)', borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '3rem 2rem 2rem', textAlign: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.3em', color: '#5a5670', textTransform: 'uppercase', marginBottom: '12px' }}>
          Коллегия Магов · Математика · Уровень 1
        </div>
        <div style={{ fontSize: '14px', marginBottom: '16px' }}>🏛️</div>
        <h1 style={{ fontFamily: 'serif', fontSize: '32px', color: '#e0bc6a', marginBottom: '8px', fontWeight: 'normal' }}>
          {LECTURE.title}
        </h1>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#a99fff', letterSpacing: '0.1em' }}>
          {LECTURE.subtitle}
        </div>
      </div>

      {/* КОНТЕНТ */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Профессор */}
        <div style={{ background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '48px', flexShrink: 0, lineHeight: 1 }}>🧙‍♂️</div>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', letterSpacing: '0.1em', marginBottom: '8px' }}>ПРОФЕССОР ГОРУС · АРХИМАГ АРИФМЕТИКИ</div>
            <div style={{ fontSize: '15px', color: '#c8c0d8', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{LECTURE.sections[0].text}"
            </div>
          </div>
        </div>

        {/* Секции */}
        {LECTURE.sections.slice(1).map((section, i) => {
          if (section.type === 'heading') return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2.5rem 0 1.25rem' }}>
              <div style={{ height: '1px', flex: 1, background: 'rgba(201,168,76,0.2)' }}></div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#e0bc6a', letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{section.text}</div>
              <div style={{ height: '1px', flex: 1, background: 'rgba(201,168,76,0.2)' }}></div>
            </div>
          )

          if (section.type === 'text') return (
            <p key={i} style={{ fontSize: '16px', color: '#b8b0c8', lineHeight: 1.8, marginBottom: '1.25rem' }}>
              {section.text}
            </p>
          )

          if (section.type === 'quote') return (
            <div key={i} style={{ borderLeft: '3px solid rgba(201,168,76,0.4)', padding: '1rem 1.5rem', margin: '1.5rem 0', background: 'rgba(201,168,76,0.04)', borderRadius: '0 8px 8px 0' }}>
              <p style={{ fontSize: '15px', color: '#e0bc6a', fontStyle: 'italic', lineHeight: 1.7 }}>{section.text}</p>
            </div>
          )

          if (section.type === 'formula') return (
            <div key={i} style={{ background: '#171920', border: '1px solid rgba(123,108,255,0.25)', borderRadius: '10px', padding: '1.25rem 1.5rem', margin: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '28px', color: '#a99fff', whiteSpace: 'nowrap' }}>{section.text}</div>
              <div style={{ fontSize: '13px', color: '#5a5670', fontStyle: 'italic', lineHeight: 1.5 }}>{section.hint}</div>
            </div>
          )

          if (section.type === 'outro') return (
            <div key={i} style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '12px', padding: '1.5rem', margin: '2.5rem 0 0', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '28px', flexShrink: 0 }}>🧙‍♂️</div>
              <p style={{ fontSize: '15px', color: '#c8b0b0', lineHeight: 1.7, fontStyle: 'italic' }}>"{section.text}"</p>
            </div>
          )

          return null
        })}

        {/* Кнопки */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '3rem' }}>
          <div onClick={() => router.push('/hub')} style={{ padding: '14px', background: '#1c1f2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px', color: '#5a5670', cursor: 'pointer' }}>
            ← Вернуться в хаб
          </div>
          <div onClick={() => router.push('/hub')} style={{ padding: '14px', background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: '10px', textAlign: 'center', fontFamily: 'monospace', fontSize: '13px', color: '#e05555', cursor: 'pointer' }}>
            ⚔️ Идти в данж →
          </div>
        </div>

      </div>
    </div>
  )
}
