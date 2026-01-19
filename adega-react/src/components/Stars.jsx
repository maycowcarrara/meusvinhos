import { useMemo, useState } from 'react'

export default function Stars({
    value = 0,
    max = 5,
    readOnly = false,
    onChange,
    className = '',
    showBadge = true,
}) {
    const v = Number.isFinite(Number(value)) ? Number(value) : 0
    const [hover, setHover] = useState(0)

    const display = hover || v
    const isEmpty = v <= 0

    const rootClass = useMemo(() => {
        const parts = ['stars', isEmpty ? 'is-empty' : 'is-rated', readOnly ? 'is-readonly' : 'is-editable']
        if (className) parts.push(className)
        return parts.join(' ')
    }, [className, isEmpty, readOnly])

    const set = (n) => {
        if (readOnly) return
        const next = n === v ? 0 : n
        onChange?.(next)
    }

    return (
        <div className={rootClass} aria-label={`Avaliação ${v || 0} de ${max}`}>
            {Array.from({ length: max }).map((_, i) => {
                const n = i + 1
                const on = n <= display

                if (readOnly) {
                    return (
                        <span key={n} className={`star ${on ? 'is-on' : 'is-off'}`} aria-hidden="true">
                            ★
                        </span>
                    )
                }

                return (
                    <button
                        key={n}
                        type="button"
                        className="star-btn"
                        onClick={() => set(n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        onFocus={() => setHover(n)}
                        onBlur={() => setHover(0)}
                        aria-label={v === n ? `Remover avaliação ${n}` : `Avaliar com ${n}`}
                    >
                        <span className={`star ${on ? 'is-on' : 'is-off'}`} aria-hidden="true">
                            ★
                        </span>
                    </button>
                )
            })}

            {showBadge && v > 0 && <span className="stars-badge">{v}/{max}</span>}
        </div>
    )
}
