'use client'

import { MUL_SPRINT_ACHIEVEMENT_CORRECT } from '@/lib/mul-table'

type Props = {
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.18em', color: '#a99fff', textTransform: 'uppercase', marginBottom: '8px' }}>
        {title}
      </h3>
      <div style={{ fontSize: '14px', color: '#b8b0c8', lineHeight: 1.75 }}>{children}</div>
    </section>
  )
}

export default function MulTrainerHelpModal({ onClose }: Props) {
  return (
    <div className="lf-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="lf-modal-panel"
        style={{ maxWidth: '520px', maxHeight: 'min(85vh, 640px)', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="mul-help-title"
      >
        <div id="mul-help-title" style={{ fontFamily: 'serif', fontSize: '22px', color: '#e0bc6a', marginBottom: '6px' }}>
          Справка · таблица умножения
        </div>
        <div style={{ fontSize: '12px', color: '#5a5670', marginBottom: '1.25rem', fontStyle: 'italic' }}>
          Можно закрыть и открыть снова в любой момент — кнопка ? в шапке.
        </div>

        <Section title="С чего начать">
          <p style={{ margin: '0 0 10px' }}>
            Выбери <strong style={{ color: '#e6e2f0' }}>уровень</strong>: сначала закрепи <strong style={{ color: '#e6e2f0' }}>1–10</strong>, потом переходи на <strong style={{ color: '#e6e2f0' }}>11–20</strong>. Прогресс и рекорды у каждого уровня свои.
          </p>
          <p style={{ margin: 0 }}>
            На карте <strong style={{ color: '#e6e2f0' }}>кликни ячейку</strong> — сразу тренировка этой пары. Или выбери режим ниже и нажми «Начать».
          </p>
        </Section>

        <Section title="Цвета на карте">
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li><strong style={{ color: '#f5e6c8' }}>Оранжевые</strong> — квадраты n×n (1², 2² …).</li>
            <li><strong style={{ color: '#3db87a' }}>Зелёные</strong> — ≥90% верных и минимум 2 попытки: считается выученным.</li>
            <li><strong style={{ color: '#e05555' }}>Красноватые</strong> — слабые ячейки, их подхватит режим «Слабые».</li>
          </ul>
        </Section>

        <Section title="Режимы">
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li><strong style={{ color: '#e6e2f0' }}>Лёгкие ряды</strong> — удобные множители с лайфхаками, потом случайные.</li>
            <li><strong style={{ color: '#e6e2f0' }}>Один ряд</strong> — зафиксируй ×7, ×12… все комбинации с числом.</li>
            <li><strong style={{ color: '#e6e2f0' }}>Квадраты</strong> — только диагональ.</li>
            <li><strong style={{ color: '#e6e2f0' }}>Слабые ячейки</strong> — то, что ошибаешь или не трогал.</li>
            <li><strong style={{ color: '#e6e2f0' }}>Вся сетка</strong> — микс без подсказок.</li>
            <li><strong style={{ color: '#e6e2f0' }}>Спринт 3 мин</strong> — скорость; рекорд отдельно для 1–10 и 11–20.</li>
          </ul>
        </Section>

        <Section title="Как учить быстрее">
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>Не зубри всю таблицу сразу — <strong style={{ color: '#e6e2f0' }}>один ряд за сессию</strong>.</li>
            <li>Ошибся — прочитай подсказку; не угадывай наугад десять раз подряд.</li>
            <li>Пользуйся <strong style={{ color: '#e6e2f0' }}>зеркалом</strong>: 3×7 и 7×3 — один ответ.</li>
            <li>Когда ряд зелёный — переходи к следующему или к слабым ячейкам.</li>
            <li>В бою важна скорость: вводи ответ и жми Enter — кнопка ✓ не обязательна.</li>
          </ul>
        </Section>

        <Section title="Уровень 1–10">
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>Начни с ×2, ×5, ×10 — там простые лайфхаки.</li>
            <li>×9 = ×10 − число (7×9 = 70−7).</li>
            <li>×4 = удвоить два раза; ×8 = ещё раз удвоить.</li>
            <li>Квадраты 6²=36, 7²=49, 8²=64 — выучи как «якоря», остальное цепляется к ним.</li>
          </ul>
        </Section>

        <Section title="Уровень 11–20 · десятки">
          <p style={{ margin: '0 0 10px' }}>
            Здесь почти всё сводится к <strong style={{ color: '#e6e2f0' }}>×10 + остаток</strong> или к уже знакомой таблице 1–10.
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li><strong style={{ color: '#e6e2f0' }}>×11</strong> для 1–9: цифра повторяется (7×11 = 77).</li>
            <li><strong style={{ color: '#e6e2f0' }}>×12</strong> = ×10 + ×2 → 7×12 = 70 + 14 = 84.</li>
            <li><strong style={{ color: '#e6e2f0' }}>×15</strong> = ×10 + ×5; <strong style={{ color: '#e6e2f0' }}>×19</strong> = ×20 − число.</li>
            <li><strong style={{ color: '#e6e2f0' }}>×20</strong> = удвоить «десяток»: 7×20 = 140.</li>
            <li>Общий приём: 14×13 = 14×10 + 14×3 = 140 + 42 = 182.</li>
            <li>Сначала прокачай ряды ×11, ×12, ×20 — потом остальные десятки пойдут легче.</li>
          </ul>
        </Section>

        <Section title="Спидран и ачивка">
          <p style={{ margin: 0 }}>
            В спринте примеры не кончаются — цель набрать максимум верных за 3 минуты.
            Ачивка «Спринтер» — от {MUL_SPRINT_ACHIEVEMENT_CORRECT} верных с хорошей точностью. Сначала точность, потом скорость.
          </p>
        </Section>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: '10px',
            textAlign: 'center',
            fontFamily: 'serif',
            fontSize: '16px',
            color: '#e0bc6a',
            cursor: 'pointer',
          }}
        >
          Понял →
        </button>
      </div>
    </div>
  )
}
