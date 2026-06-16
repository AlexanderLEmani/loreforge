'use client'

import { isSquareCell, pairKey, tierConfig, type CellStat, type MulTierId } from '@/lib/mul-table'

type Props = {
  stats: Record<string, CellStat>
  tier?: MulTierId
  highlightRow?: number | null
  highlightCol?: number | null
  onCellClick?: (a: number, b: number) => void
}

function cellBg(stat: CellStat | undefined, a: number, b: number): string {
  if (isSquareCell(a, b)) return 'var(--lf-mul-square)'
  const acc = stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : null
  if (acc === null) return 'var(--lf-mul-cell)'
  if (acc >= 90) return 'var(--lf-mul-good)'
  if (acc >= 60) return 'var(--lf-mul-mid)'
  return 'var(--lf-mul-weak)'
}

export default function MulTableGrid({
  stats,
  tier = 'basic',
  highlightRow = null,
  highlightCol = null,
  onCellClick,
}: Props) {
  const { min, max } = tierConfig(tier)
  const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min)

  return (
    <div className={`lf-mul-table-wrap${tier === 'teens' ? ' lf-mul-table-wrap--teens' : ''}`}>
      <table className="lf-mul-table" cellSpacing={0}>
        <thead>
          <tr>
            <th className="lf-mul-table-corner" aria-hidden="true" />
            {nums.map(n => (
              <th key={`col-${n}`} className="lf-mul-table-head">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nums.map(row => (
            <tr key={row}>
              <th className="lf-mul-table-head lf-mul-table-head--row">{row}</th>
              {nums.map(col => {
                const stat = stats[pairKey(row, col)]
                const square = isSquareCell(row, col)
                const hl = highlightRow === row || highlightCol === col
                const content = row * col
                return (
                  <td
                    key={pairKey(row, col)}
                    className={[
                      'lf-mul-table-cell',
                      square && 'lf-mul-table-cell--square',
                      hl && 'lf-mul-table-cell--hl',
                    ].filter(Boolean).join(' ')}
                    style={{ background: cellBg(stat, row, col) }}
                  >
                    {onCellClick ? (
                      <button
                        type="button"
                        className="lf-mul-table-cell--btn"
                        onClick={() => onCellClick(row, col)}
                        title={`${row} × ${col} = ${content}`}
                      >
                        {content}
                      </button>
                    ) : (
                      content
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lf-mul-table-legend">
        <span><i className="lf-mul-legend-square" /> квадраты</span>
        <span><i className="lf-mul-legend-good" /> ≥90%</span>
        <span><i className="lf-mul-legend-weak" /> слабые</span>
      </div>
    </div>
  )
}
