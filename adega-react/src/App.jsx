import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { vinhos } from './data/vinhos'
import { useLocalStorage } from './hooks/useLocalStorage'
import Stars from './components/Stars'

const RATINGS_KEY = 'adega:ratings'

// PIN "1350" (disfarçado; não é segurança real em frontend)
const PIN = String.fromCharCode(49, 51, 53, 48)

// Theme storage (no seu original era wineCatalogTheme)
const THEME_KEY = 'wineCatalogTheme'

// 5 temas
const THEMES = [
  { name: 'Clássico', className: '' },
  { name: 'Moderno', className: 'theme-modern' },
  { name: 'Rústico', className: 'theme-rustic' },
  { name: 'Rosé', className: 'theme-rose' },
  { name: 'Premium', className: 'theme-gold' },
]

function formatAbv(abv) {
  const s = String(abv ?? '').trim().replace('%', '').trim()
  return s ? `${s}%` : ''
}

function suggestPairing(v) {
  const u = String(v?.uvas ?? '').toLowerCase()
  const f = Number(v?.forca) || 3

  if (u.includes('tannat')) return 'Carnes gordas, feijoada, costela, queijos bem curados.'
  if (u.includes('cabernet')) return 'Churrasco, cordeiro, carnes na brasa, queijos curados.'
  if (u.includes('malbec')) return 'Carnes grelhadas, hambúrguer, empanadas, queijos semiduros.'
  if (u.includes('syrah')) return 'Costela, barbecue, carnes defumadas, pratos com pimenta-do-reino.'
  if (u.includes('pinot')) return 'Aves, salmão, cogumelos, pratos delicados.'
  if (u.includes('carmen')) return 'Porco, frango, legumes assados, pratos com ervas e pimentões.'
  if (u.includes('tempranillo')) return 'Embutidos, tapas, cordeiro, paella, massas com carne.'
  if (u.includes('sangiovese')) return 'Massas com tomate, pizza, embutidos, queijos médios.'
  if (u.includes('montepulciano')) return 'Massas com carne, embutidos, queijos semiduros.'
  if (u.includes('niagara') || u.includes('bordô') || u.includes('bordo')) {
    return 'Sobremesas leves, frutas, queijos frescos.'
  }

  if (f <= 2) return 'Aves, massas leves, queijos frescos, entradas.'
  if (f >= 4) return 'Carnes vermelhas, grelhados, queijos curados.'
  return 'Massas, carnes assadas, queijos semiduros.'
}

function Flag({ country }) {
  switch (country) {
    case 'Portugal':
      return (
        <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#f00" d="M0 0h600v400H0z" />
          <path fill="#006600" d="M0 0h240v400H0z" />
          <g transform="translate(240 200)">
            <circle fill="#ff0" r="88" />
            <path fill="#fff" d="M-50-60h100v100c0 40-20 60-50 60s-50-20-50-60z" />
            <path fill="#f00" d="M-40-50h80v90c0 30-10 40-40 40s-40-10-40-40z" />
            <path
              fill="#003399"
              d="M-25-30h10v10h-10zm20 0h10v10h-10zm20 0h10v10h-10zm-40 20h10v10h-10zm20 0h10v10h-10zm20 0h10v10h-10zm-40 20h10v10h-10zm20 0h10v10h-10zm20 0h10v10h-10z"
            />
          </g>
        </svg>
      )

    case 'Espanha':
      return (
        <svg viewBox="0 0 750 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#AA151B" d="M0 0h750v500H0z" />
          <path fill="#F1BF00" d="M0 125h750v250H0z" />
          <g transform="translate(150 160) scale(0.6)">
            <path fill="#FFF" d="M0 0h100v100H0z" stroke="#000" />
            <path fill="#AA151B" d="M10 10h80v80H10z" />
          </g>
        </svg>
      )

    case 'Chile':
      return (
        <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#d52b1e" d="M0 300h900v300H0z" />
          <path fill="#fff" d="M300 0h600v300H300z" />
          <path fill="#0039a6" d="M0 0h300v300H0z" />
          <path fill="#fff" d="M150 85l47 145h-152l123-89-47 145 47-145-123-89h152z" />
        </svg>
      )

    case 'Argentina':
      return (
        <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#75aadb" d="M0 0h900v600H0z" />
          <path fill="#fff" d="M0 200h900v200H0z" />
          <circle cx="450" cy="300" r="40" fill="#f6b40e" />
        </svg>
      )

    case 'França':
      return (
        <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#ED2939" d="M0 0h900v600H0z" />
          <path fill="#fff" d="M0 0h600v600H0z" />
          <path fill="#002395" d="M0 0h300v600H0z" />
        </svg>
      )

    case 'Itália':
      return (
        <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path fill="#CE2B37" d="M0 0h900v600H0z" />
          <path fill="#fff" d="M0 0h600v600H0z" />
          <path fill="#009246" d="M0 0h300v600H0z" />
        </svg>
      )

    case 'Brasil':
      return (
        <svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="700" height="500" fill="#009c3b" />
          <path d="M350 35L665 250L350 465L35 250Z" fill="#ffdf00" />
          <circle cx="350" cy="250" r="125" fill="#002776" />
          <path d="M240 250 A200 200 0 0 0 550 200" stroke="#fff" strokeWidth="15" fill="none" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="120" height="80" fill="#ddd" />
          <path d="M0 0L120 80M120 0L0 80" stroke="#aaa" strokeWidth="6" />
        </svg>
      )
  }
}

function HeaderIcon() {
  return (
    <svg className="header-icon" viewBox="0 0 24 24" width="60" height="60" aria-hidden="true">
      <path d="M12 2C12.55 2 13 2.45 13 3V4.17C14.17 4.58 15 5.69 15 7C15 8.66 13.66 10 12 10C10.34 10 9 8.66 9 7C9 5.69 9.83 4.58 11 4.17V3C11 2.45 11.45 2 12 2M17 9C18.1 9 19 9.9 19 11C19 12.1 18.1 13 17 13C16.9 13 16.8 13 16.7 12.98C16.89 12.38 17 11.72 17 11.03V11H17M7 9C7 11.03 7.11 12.38 7.3 12.98C7.2 13 7.1 13 7 13C5.9 13 5 12.1 5 11C5 9.9 5.9 9 7 9M12 11C13.66 11 15 12.34 15 14C15 15.66 13.66 17 12 17C10.34 17 9 15.66 9 14C9 12.34 10.34 11 12 11M17.3 14.02C17.11 14.62 17 15.97 17 18C17 19.1 16.1 20 15 20C14.72 20 14.45 19.94 14.2 19.84C14.54 19.04 14.82 18.07 14.94 17.01C14.98 17 15.02 16.99 15.06 16.99C15.04 16.95 15.02 16.92 15 16.88C14.78 16.95 14.54 16.99 14.3 17.02C14.11 17.62 14 18.97 14 21C14 22.1 13.1 23 12 23C10.9 23 10 22.1 10 21C10 18.97 9.89 17.62 9.7 17.02C9.46 16.99 9.22 16.95 9 16.88C8.98 16.92 8.96 16.95 8.94 16.99C8.98 16.99 9.02 17 9.06 17.01C9.18 18.07 9.46 19.04 9.8 19.84C9.55 19.94 9.28 20 9 20C7.9 20 7 19.1 7 18C7 15.97 6.89 14.62 6.7 14.02C6.8 14.01 6.9 14 7 14C7.02 14 7.04 14 7.06 14C7.14 14.78 7.33 15.63 7.58 16.51C7.83 16.45 8.09 16.41 8.37 16.39C8.43 15.71 8.65 15.12 9 14.65V14.64C9 14.42 9.04 14.21 9.13 14.01C9.7 13.63 10.74 13.31 11.97 13.04C12.04 13.31 13.7 13.63 14.27 14.01C14.35 14.21 14.39 14.42 14.39 14.64V14.65C14.74 15.12 14.97 15.71 15.02 16.39C15.3 16.41 15.57 16.45 15.82 16.51C16.06 15.63 16.25 14.78 16.33 14C16.35 14 16.37 14 16.39 14C16.49 14 16.59 14.01 16.69 14.02Z" />
    </svg>
  )
}

/* =========================
   GUIA RÁPIDO (ATUALIZADO)
   ========================= */
function GuideModal({ onClose }) {
  const grapesLeft = [
    {
      name: 'Cabernet Sauvignon',
      desc: 'Encorpado, tanino alto, acidez média; notas de cassis/cedro (pode ter toque vegetal em climas frios).',
      pair: 'Churrasco, cordeiro, queijos curados, molhos com redução.',
    },
    {
      name: 'Malbec',
      desc: 'Médio a encorpado, tanino médio; fruta escura e violeta, às vezes chocolate.',
      pair: 'Carnes grelhadas, hambúrguer, empanadas, pratos com páprica/cominho.',
    },
    {
      name: 'Syrah',
      desc: 'Médio a encorpado, tanino médio/alto; pimenta-preta, amora, toque defumado.',
      pair: 'Costela, barbecue, carnes na brasa, pratos com pimenta-do-reino.',
    },
    {
      name: 'Tannat',
      desc: 'Encorpado, tanino alto, estrutura grande; amora, cacau, especiarias.',
      pair: 'Carnes gordas, feijoada, costela, queijos bem curados (pede proteína).',
    },
  ]

  const grapesRight = [
    {
      name: 'Merlot',
      desc: 'Médio a encorpado, tanino médio e macio; ameixa, chocolate, ervas secas.',
      pair: 'Massas ao ragù, frango assado, carnes menos gordas, queijos semiduros.',
    },
    {
      name: 'Carménère',
      desc: 'Médio, tanino médio; especiarias e perfil herbáceo (pimentão doce/ervas), fruta escura.',
      pair: 'Porco, frango, legumes assados, pratos com ervas e pimentões.',
    },
    {
      name: 'Pinot Noir',
      desc: 'Leve a médio, tanino baixo, acidez alta; cereja/morango, terra/cogumelos.',
      pair: 'Aves, salmão, risoto de funghi, pratos delicados e com ervas.',
    },
    {
      name: 'Tempranillo',
      desc: 'Médio a encorpado, tanino médio; cereja e, com evolução/madeira, couro/tabaco/baunilha.',
      pair: 'Embutidos, tapas, cordeiro, paella, massas com carne.',
    },
  ]

  const sectionTitleStyle = {
    textAlign: 'center',
    color: 'var(--primary)',
    marginBottom: 30,
    fontFamily: 'var(--font-title)',
  }

  return (
    <div className="modal no-print" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>
          &times;
        </span>

        <h2 style={sectionTitleStyle}>Guia Rápido de Vinhos</h2>

        <div className="guide-grid">
          <div className="guide-card">
            <div className="guide-title">O Básico</div>
            <div className="guide-text">
              <ul className="guide-list">
                <li>
                  <strong>Corpo:</strong> “peso” na boca (leve → médio → encorpado); aumenta com álcool, extração e madeira.
                </li>
                <li>
                  <strong>Taninos:</strong> secura/aderência na gengiva; amacia com proteína (carne/queijos) e pode pesar com pimenta.
                </li>
                <li>
                  <strong>Acidez:</strong> salivação e frescor; corta gordura e funciona muito bem com tomate/limão.
                </li>
                <li>
                  <strong>Doçura:</strong> do seco ao doce; em sobremesa, o vinho deve ser mais doce que o prato.
                </li>
                <li>
                  <strong>Álcool (ABV):</strong> aquece e aumenta sensação de corpo; comida picante realça o álcool.
                </li>
                <li>
                  <strong>Madeira:</strong> pode trazer baunilha/tostado/especiarias e mais estrutura (pede prato mais intenso).
                </li>
              </ul>
            </div>
          </div>

          <div className="guide-card">
            <div className="guide-title">Serviço</div>
            <div className="guide-text">
              <ul className="guide-list">
                <li>
                  <strong>Temperatura:</strong> tintos 16–18°C; brancos 8–12°C; espumantes 6–8°C.
                </li>
                <li>
                  <strong>Aeração (atalho):</strong> tintos jovens/estruturados 20–40 min de ar; vinhos delicados, pouco ar.
                </li>
                <li>
                  <strong>Ordem de prova:</strong> leve → encorpado, seco → doce.
                </li>
                <li>
                  <strong>Safra “NV”:</strong> sem ano específico (não é defeito; é estilo/assemblage).
                </li>
              </ul>
            </div>
          </div>

          <div className="guide-card">
            <div className="guide-title">Harmonização</div>
            <div className="guide-text">
              <ul className="guide-list">
                <li>
                  <strong>Intensidade:</strong> prato leve pede vinho leve; prato forte pede estrutura.
                </li>
                <li>
                  <strong>Acidez × gordura:</strong> vinhos mais ácidos “limpam” fritura e molhos cremosos.
                </li>
                <li>
                  <strong>Tanino × proteína:</strong> taninos gostam de carne e grelha (amacia a adstringência).
                </li>
                <li>
                  <strong>Doçura × picância:</strong> leve doçura e baixo álcool ajudam com pimenta.
                </li>
                <li>
                  <strong>Sal/umami:</strong> sal realça fruta; muito umami pode pedir mais fruta e tanino moderado.
                </li>
              </ul>
            </div>
          </div>

          <div className="guide-card">
            <div className="guide-title">Como provar</div>
            <div className="guide-text">
              <ol className="guide-list">
                <li>
                  <strong>Olhe:</strong> cor/intensidade e “lágrimas” (pista de álcool/viscosidade).
                </li>
                <li>
                  <strong>Cheire:</strong> fruta, flores, ervas, madeira, notas de evolução.
                </li>
                <li>
                  <strong>Prove:</strong> acidez (saliva), tanino (secura), corpo, álcool e final (persistência).
                </li>
              </ol>

              <ul className="guide-list" style={{ marginTop: 10 }}>
                <li>
                  <strong>Equilíbrio:</strong> quando nada “grita” (álcool, madeira, acidez e fruta conversam).
                </li>
                <li>
                  <strong>Alertas:</strong> mofo/papelão (possível rolha), maçã passada (oxidação), enxofre (redução).
                </li>
              </ul>
            </div>
          </div>

          <div className="guide-card" style={{ gridColumn: '1 / -1' }}>
            <div className="guide-title">Glossário de Uvas</div>

            <div className="guide-text glossary">
              <div>
                {grapesLeft.map((it) => (
                  <div key={it.name} className="grape-item">
                    <span className="grape-name">{it.name}</span>
                    <div className="grape-desc">{it.desc}</div>
                    <div className="grape-pair">
                      <strong>Harmoniza:</strong> {it.pair}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                {grapesRight.map((it) => (
                  <div key={it.name} className="grape-item">
                    <span className="grape-name">{it.name}</span>
                    <div className="grape-desc">{it.desc}</div>
                    <div className="grape-pair">
                      <strong>Harmoniza:</strong> {it.pair}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   LIGHTBOX (premium + zoom/pan + setas p/ Frente/Verso)
   Requer CSS: .lightbox, .lb-topbar, .lb-icon-btn, .lightbox-controls, .lb-btn, .lb-zoom-pill, .lb-nav, etc.
   ========================= */
function Lightbox({ open, slides, index, onClose, onPrev, onNext }) {
  const slide = slides?.[index]
  const hasMany = (slides?.length || 0) > 1

  const [hiLoaded, setHiLoaded] = useState(false)
  const [scale, setScale] = useState(1)

  const [minScale, setMinScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  const imgRef = useRef(null)


  // swipe/pan refs
  const swipeRef = useRef({
    active: false,
    id: null,
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    t0: 0,
  })

  const scaleRef = useRef(scale)
  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  const dragRef = useRef({
    active: false,
    id: null,
    x0: 0,
    y0: 0,
    tx0: 0,
    ty0: 0,
  })

  const wrapRef = useRef(null)

  const clamp = useCallback((n, min, max) => Math.max(min, Math.min(max, n)), [])

  const calculateMinScale = useCallback((img, container) => {
    const scaleX = container.clientWidth / img.naturalWidth
    const scaleY = container.clientHeight / img.naturalHeight
    return Math.min(scaleX, scaleY)
  }, [])

  const clampPan = useCallback(
    (x, y, scale) => {
      const img = imgRef.current
      const container = wrapRef.current
      if (!img || !container) return { x, y }

      const imgW = img.naturalWidth * scale
      const imgH = img.naturalHeight * scale

      const maxX = Math.max(0, imgW - container.clientWidth)
      const maxY = Math.max(0, imgH - container.clientHeight)

      return {
        x: clamp(x, -maxX, 0),
        y: clamp(y, -maxY, 0),
      }
    },
    [clamp]
  )


  const resetZoom = useCallback(() => {
    setScale(minScale)
    setTx(0)
    setTy(0)
  }, [])

  const zoom = useCallback(
    (delta) => {
      setScale((prev) => {
        const next = clamp(Number((prev + delta).toFixed(2)), minScale, 8)

        // 🔥 ESSENCIAL: ao sair do scale 1, garante pan ativo
        if (prev === 1 && next > 1) {
          setTx(0)
          setTy(0)
        }

        return next
      })
    },
    [clamp, minScale]
  )


  // trava scroll + teclas
  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') zoom(0.2)
      if (e.key === '-' || e.key === '_') zoom(-0.2)
      if (e.key === '0') resetZoom()
      if (hasMany && e.key === 'ArrowLeft') onPrev?.()
      if (hasMany && e.key === 'ArrowRight') onNext?.()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, hasMany, onClose, onPrev, onNext, resetZoom, zoom])

  // quando muda o slide, reseta zoom e faz preload da hi-res do slide atual
  useEffect(() => {
    if (!open) return

    setHiLoaded(false)
    resetZoom()

    if (!slide?.highSrc) return

    let cancelled = false
    const img = new Image()

    const done = (ok) => {
      if (cancelled) return
      setHiLoaded(ok)
    }

    // IMPORTANTE: handlers antes do src (cache pode "ganhar" e não disparar onload)
    img.onload = () => done(true)
    img.onerror = () => done(false)

    img.src = slide.highSrc

    // Se já veio do cache, garante estado correto
    if (img.complete) done(true)

    // Opcional: melhora a chance de já trocar quando decodificar
    if (img.decode) {
      img.decode().then(() => done(true)).catch(() => { })
    }

    return () => {
      cancelled = true
    }
  }, [open, slide?.highSrc, resetZoom])

  // Wheel (zoom) com listener nativo { passive: false } para permitir preventDefault sem warning
  useEffect(() => {
    const el = wrapRef.current
    if (!open || !el) return

    const handler = (ev) => {
      ev.preventDefault()
      zoom(ev.deltaY < 0 ? 0.2 : -0.2)
    }

    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [open, zoom])

  function onPointerDown(e) {
    e.preventDefault()

    // tenta capturar ponteiro (ajuda em alguns browsers)
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      // ignore
    }

    // swipe tracking
    swipeRef.current = {
      active: true,
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      x1: e.clientX,
      y1: e.clientY,
      t0: Date.now(),
    }

    // pan começa só se estiver com zoom
    if (scaleRef.current > 1) {
      dragRef.current = {
        active: true,
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        tx0: tx,
        ty0: ty,
      }
    } else {
      dragRef.current.active = false
      dragRef.current.id = e.pointerId
    }

    // listeners globais (resolve desktop/mobile)
    const onWinMove = (ev) => {
      if (ev.pointerId !== dragRef.current.id) return

      // atualiza swipe
      if (swipeRef.current.active && swipeRef.current.id === ev.pointerId) {
        swipeRef.current.x1 = ev.clientX
        swipeRef.current.y1 = ev.clientY
      }

      // pan só se zoom > 1 e drag ativo
      if (!dragRef.current.active || scaleRef.current <= 1) return
      ev.preventDefault()

      const dx = ev.clientX - dragRef.current.x0
      const dy = ev.clientY - dragRef.current.y0
      const nextX = dragRef.current.tx0 + dx
      const nextY = dragRef.current.ty0 + dy
      const p = clampPan(nextX, nextY, scaleRef.current)

      setTx(p.x)
      setTy(p.y)
    }

    const onWinUp = (ev) => {
      if (ev.pointerId !== dragRef.current.id) return

      window.removeEventListener('pointermove', onWinMove)
      window.removeEventListener('pointerup', onWinUp)
      window.removeEventListener('pointercancel', onWinUp)

      // tenta soltar capture
      try {
        wrapRef.current?.releasePointerCapture?.(ev.pointerId)
      } catch {
        // ignore
      }

      const wasPanning = dragRef.current.active && scaleRef.current > 1
      dragRef.current.active = false

      // se estava dando pan, não faz swipe
      if (wasPanning) {
        swipeRef.current.active = false
        return
      }

      // swipe só em zoom 1
      if (!hasMany || scaleRef.current > 1) {
        swipeRef.current.active = false
        return
      }

      const s = swipeRef.current
      if (!s.active || s.id !== ev.pointerId) return
      swipeRef.current.active = false

      const dx = s.x1 - s.x0
      const dy = s.y1 - s.y0
      const dt = Date.now() - s.t0

      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      const MIN_X = 60
      const MAX_Y = 80
      const MAX_DT = 650
      const H_DOMINANT = absX > absY * 1.2

      if (dt > MAX_DT) return
      if (absX < MIN_X) return
      if (absY > MAX_Y) return
      if (!H_DOMINANT) return

      if (dx < 0) onNext?.()
      else onPrev?.()
    }

    window.addEventListener('pointermove', onWinMove, { passive: false })
    window.addEventListener('pointerup', onWinUp)
    window.addEventListener('pointercancel', onWinUp)
  }

  // wrappers ficam apenas para manter compatibilidade (não precisam fazer nada)
  function onPointerMove(e) {
    // vazio de propósito (o pan está no window)
  }

  function onPointerUp(e) {
    // vazio de propósito (o pan/snap está no window)
  }

  if (!open || !slide) return null

  const srcToShow = hiLoaded ? slide.highSrc : slide.lowSrc
  const transform = `translate(${tx}px, ${ty}px)`

  return (
    <div className="lightbox no-print" onClick={onClose} role="dialog" aria-modal="true" aria-label={slide.title}>
      {/* Topbar */}
      <div className="lb-topbar" onClick={(e) => e.stopPropagation()}>
        <div className="lb-title" title={slide.title}>
          {slide.title}
        </div>
        <button className="lb-icon-btn" onClick={onClose} aria-label="Fechar">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      {/* Setas (Frente/Verso) */}
      {hasMany && (
        <>
          <button
            className="lb-nav lb-nav--left"
            onClick={(e) => {
              e.stopPropagation()
              onPrev?.()
            }}
            aria-label="Imagem anterior"
            title="Anterior (←)"
          >
            ‹
          </button>

          <button
            className="lb-nav lb-nav--right"
            onClick={(e) => {
              e.stopPropagation()
              onNext?.()
            }}
            aria-label="Próxima imagem"
            title="Próxima (→)"
          >
            ›
          </button>
        </>
      )}

      {/* Imagem (pan/zoom) */}
      <div
        ref={wrapRef}
        className={`lightbox-content-wrapper ${scale > 1 ? 'is-zoomed' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imgRef}
          src={srcToShow}
          draggable="false"
          onLoad={() => {
            const img = imgRef.current
            const container = wrapRef.current
            if (!img || !container) return

            const min = calculateMinScale(img, container)

            const scaledW = img.naturalWidth * min
            const scaledH = img.naturalHeight * min

            const tx = (container.clientWidth - scaledW) / 2
            const ty = (container.clientHeight - scaledH) / 2

            setMinScale(min)
            setScale(min)
            setTx(tx)
            setTy(ty)
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: 'top left',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        {!hiLoaded && <div className="lb-loading">Carregando original…</div>}
      </div>

      {/* Controles */}
      <div className="lightbox-controls" onClick={(e) => e.stopPropagation()}>
        <button className="lb-btn" onClick={() => zoom(-0.2)} aria-label="Diminuir zoom">
          −
        </button>

        <div className="lb-zoom-pill" aria-label={`Zoom ${Math.round(scale * 100)}%`}>
          {Math.round(scale * 100)}%
        </div>

        <button className="lb-btn" onClick={() => zoom(0.2)} aria-label="Aumentar zoom">
          +
        </button>

        {scale > 1 && (
          <button className="lb-btn lb-btn--ghost" onClick={resetZoom} aria-label="Reset zoom">
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default function App() {
  // filtros
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [year, setYear] = useState('')
  const [abv, setAbv] = useState('')
  const [sort, setSort] = useState('nome')

  // rating
  const [ratings, setRatings] = useLocalStorage(RATINGS_KEY, {})

  // modo edição (inline)
  const [isEditMode, setIsEditMode] = useState(false)

  // modal PIN
  const [isPinOpen, setIsPinOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)

  // modal Dashboard
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)

  // modal Guia
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  // lightbox (agora com slides + index)
  const [lb, setLb] = useState({ open: false, index: 0, slides: [] })
  const preloadedRef = useRef(new Set())

  // tema (índice salvo)
  const [themeIndex, setThemeIndex] = useState(() => {
    const raw = localStorage.getItem(THEME_KEY)
    const n = raw == null ? 0 : parseInt(raw, 10)
    return Number.isFinite(n) ? n : 0
  })

  const currentTheme = THEMES[((themeIndex % THEMES.length) + THEMES.length) % THEMES.length]

  useEffect(() => {
    const allThemeClasses = THEMES.map((t) => t.className).filter(Boolean)
    document.body.classList.remove(...allThemeClasses)
    if (currentTheme.className) document.body.classList.add(currentTheme.className)
    localStorage.setItem(THEME_KEY, String(((themeIndex % THEMES.length) + THEMES.length) % THEMES.length))
  }, [themeIndex, currentTheme.className])

  const countries = useMemo(() => Array.from(new Set(vinhos.map((v) => v.pais))).sort(), [])
  const years = useMemo(() => Array.from(new Set(vinhos.map((v) => v.safra))).sort(), [])
  const abvs = useMemo(() => Array.from(new Set(vinhos.map((v) => v.abv))).sort(), [])

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()
    const parseAbv = (str) => parseFloat(String(str ?? '').replace('%', '').replace(',', '.').trim())
    const parseSafra = (str) => (String(str) === 'NV' ? 0 : parseInt(str, 10))

    let list = vinhos.filter((v) => {
      const allData = `${v.nome} ${v.pais} ${v.regiao} ${v.uvas} ${v.safra} ${v.abv}`.toLowerCase()
      return allData.includes(text) && (!country || v.pais === country) && (!year || v.safra === year) && (!abv || v.abv === abv)
    })

    list.sort((a, b) => {
      switch (sort) {
        case 'nome':
          return a.nome.localeCompare(b.nome)
        case 'forcaDesc':
          return b.forca - a.forca
        case 'forcaAsc':
          return a.forca - b.forca
        case 'safraDesc':
          return parseSafra(b.safra) - parseSafra(a.safra)
        case 'safraAsc':
          return parseSafra(a.safra) - parseSafra(b.safra)
        case 'abvDesc':
          return parseAbv(b.abv) - parseAbv(a.abv)
        default:
          return 0
      }
    })

    return list
  }, [search, country, year, abv, sort])

  function clearFilters() {
    setSearch('')
    setCountry('')
    setYear('')
    setAbv('')
    setSort('nome')
  }

  function openEdit() {
    if (unlocked) {
      setIsEditMode((v) => !v)
      return
    }
    setIsPinOpen(true)
    setPinInput('')
  }

  function closePinModal() {
    setIsPinOpen(false)
    setPinInput('')
  }

  function unlock() {
    if (pinInput === PIN) {
      setUnlocked(true)
      setIsEditMode(true)
      closePinModal()
    } else {
      alert('PIN incorreto.')
    }
  }

  function lockEditing() {
    setIsEditMode(false)
    setUnlocked(false)
    setPinInput('')
    setIsPinOpen(false)
  }

  function setRating(wineName, val) {
    setRatings((prev) => ({ ...prev, [wineName]: val }))
  }

  const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`

  // FABs
  function openHelp() {
    setIsGuideOpen(true)
  }

  function closeHelp() {
    setIsGuideOpen(false)
  }

  function openDashboard() {
    setIsDashboardOpen(true)
  }

  function closeDashboard() {
    setIsDashboardOpen(false)
  }

  const warmup = useCallback((src) => {
    if (!src) return
    if (preloadedRef.current.has(src)) return
    preloadedRef.current.add(src)
    const img = new Image()
    img.src = src
  }, [])

  const openLightboxSlides = useCallback(
    ({ slides, index = 0 }) => {
      setLb({ open: true, slides: slides || [], index })

      // aquece atual + vizinhos (para troca rápida frente/verso)
      warmup(slides?.[index]?.highSrc)
      warmup(slides?.[index + 1]?.highSrc)
      warmup(slides?.[index - 1]?.highSrc)
    },
    [warmup]
  )

  function closeLightbox() {
    setLb((s) => ({ ...s, open: false }))
  }

  const lbPrev = useCallback(() => {
    setLb((s) => {
      const n = s.slides?.length || 0
      if (n <= 1) return s
      const nextIndex = (s.index - 1 + n) % n
      warmup(s.slides?.[nextIndex]?.highSrc)
      return { ...s, index: nextIndex }
    })
  }, [warmup])

  const lbNext = useCallback(() => {
    setLb((s) => {
      const n = s.slides?.length || 0
      if (n <= 1) return s
      const nextIndex = (s.index + 1) % n
      warmup(s.slides?.[nextIndex]?.highSrc)
      return { ...s, index: nextIndex }
    })
  }, [warmup])

  // Fechar modais no ESC
  useEffect(() => {
    if (!isDashboardOpen && !isGuideOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDashboardOpen) closeDashboard()
        if (isGuideOpen) closeHelp()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isDashboardOpen, isGuideOpen])

  // Dados do dashboard (dinâmico)
  const dashboard = useMemo(() => {
    const total = vinhos.length

    const parseAbv = (str) => {
      const n = parseFloat(String(str ?? '').replace('%', '').replace(',', '.').trim())
      return Number.isFinite(n) ? n : 0
    }

    const countryCounts = {}
    const grapeCounts = {}
    const strengthCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let sumAbv = 0

    for (const v of vinhos) {
      countryCounts[v.pais] = (countryCounts[v.pais] ?? 0) + 1
      sumAbv += parseAbv(v.abv)

      const k = Number(v.forca)
      if (k >= 1 && k <= 5) strengthCounts[k]++

      String(v.uvas)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((g) => {
          grapeCounts[g] = (grapeCounts[g] ?? 0) + 1
        })
    }

    const countriesSorted = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a])
    const top3 = countriesSorted.slice(0, 3)
    const top3Sum = top3.reduce((acc, c) => acc + countryCounts[c], 0)
    const othersCount = Math.max(0, total - top3Sum)

    // pizza com conic-gradient
    const colors = ['var(--primary)', 'var(--accent)', '#888']
    let cur = 0
    const stops = []
    for (let i = 0; i < top3.length; i++) {
      const c = top3[i]
      const deg = total ? (countryCounts[c] / total) * 360 : 0
      stops.push(`${colors[i]} ${cur}deg ${cur + deg}deg`)
      cur += deg
    }
    if (othersCount > 0) stops.push(`#e6e6e6 ${cur}deg 360deg`)
    const pieBackground = `conic-gradient(${stops.join(', ')})`

    const topGrapes = Object.keys(grapeCounts)
      .sort((a, b) => grapeCounts[b] - grapeCounts[a])
      .slice(0, 5)
      .map((g) => ({ name: g, count: grapeCounts[g] }))

    const ratingVals = Object.values(ratings ?? {})
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0)

    const avgRating = ratingVals.length ? ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length : 0

    return {
      total,
      countriesCount: Object.keys(countryCounts).length,
      avgAbv: total ? sumAbv / total : 0,
      top3,
      countryCounts,
      othersCount,
      pieBackground,
      topGrapes,
      strengthCounts,
      avgRating,
      ratedCount: ratingVals.length,
    }
  }, [ratings])

  function toggleTheme() {
    setThemeIndex((i) => (i + 1) % THEMES.length)
  }

  const themeBadgeStyle = {
    position: 'fixed',
    left: 12,
    bottom: 12,
    zIndex: 90000,
    fontSize: 12,
    letterSpacing: 0.6,
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(0,0,0,0.10)',
    padding: '6px 10px',
    borderRadius: 999,
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    pointerEvents: 'none',
    userSelect: 'none',
  }

  return (
    <div className="app-container">
      <header className="header-container">
        <div className="header-title-area">
          <HeaderIcon />
          <h1 className="main-title">Adega Pessoal M&amp;M</h1>
          <p className="main-subtitle">Coleção Selecionada • Catálogo Analítico</p>
        </div>

        <div className="filter-bar no-print">
          <input className="filter-input" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />

          <select className="filter-select" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">País</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select className="filter-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Safra</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select className="filter-select" value={abv} onChange={(e) => setAbv(e.target.value)}>
            <option value="">Álcool</option>
            {abvs.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="nome">Nome (A-Z)</option>
            <option value="forcaDesc">Força +</option>
            <option value="forcaAsc">Força -</option>
            <option value="safraDesc">Safra nova</option>
            <option value="safraAsc">Safra antiga</option>
            <option value="abvDesc">Álcool +</option>
          </select>

          <button className="action-btn action-btn--danger" onClick={clearFilters} title="Limpar">
            X
          </button>

          <button
            className="action-btn"
            onClick={openEdit}
            title={unlocked ? (isEditMode ? 'Sair da edição' : 'Entrar em edição') : 'Desbloquear edição'}
          >
            ✎
          </button>

          {unlocked && (
            <button className="action-btn action-btn--ghost" onClick={lockEditing} title="Travar edição">
              🔒
            </button>
          )}

          <div className="filter-stats">Exibindo {filtered.length} rótulos</div>
        </div>
      </header>

      <main className="catalog-grid">
        {filtered.map((v) => {
          const forca = Number(v.forca) || 0
          const pctForca = Math.max(0, Math.min(100, (forca / 5) * 100))
          const harmonizaText = v.harmoniza || suggestPairing(v)

          // thumb (leve) -> original (pesado)
          // se não existir thumbFrente/thumbVerso no data, cai no original
          const frontLow = `${BASE}${v.thumbFrente || v.imgFrente}`
          const frontHi = `${BASE}${v.imgFrente}`
          const backLow = `${BASE}${v.thumbVerso || v.imgVerso}`
          const backHi = `${BASE}${v.imgVerso}`

          const slides = [
            { title: `${v.nome} — Frente`, lowSrc: frontLow, highSrc: frontHi },
            { title: `${v.nome} — Verso`, lowSrc: backLow, highSrc: backHi },
          ]

          return (
            <div className="wine-card" key={v.nome}>
              <div className="card-top-solid" />
              <div className="card-wave-top" />
              <div className="bg-text-top">{v.nome}</div>

              <div className="card-body">
                {/* Fotos (thumb leve no card + hi-res só ao clicar) */}
                <div className="photos">
                  <div className="photo-frame">
                    <button
                      type="button"
                      className="photo-btn"
                      onClick={() => openLightboxSlides({ slides, index: 0 })}
                      onMouseEnter={() => warmup(frontHi)}
                      onFocus={() => warmup(frontHi)}
                      onTouchStart={() => warmup(frontHi)}
                      aria-label={`Abrir foto da frente: ${v.nome}`}
                      title="Clique para ampliar"
                    >
                      <img
                        className="wine-photo"
                        src={frontLow}
                        alt="Frente"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </button>
                  </div>

                  <div className="photo-frame">
                    <button
                      type="button"
                      className="photo-btn"
                      onClick={() => openLightboxSlides({ slides, index: 1 })}
                      onMouseEnter={() => warmup(backHi)}
                      onFocus={() => warmup(backHi)}
                      onTouchStart={() => warmup(backHi)}
                      aria-label={`Abrir foto do verso: ${v.nome}`}
                      title="Clique para ampliar"
                    >
                      <img
                        className="wine-photo"
                        src={backLow}
                        alt="Verso"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </button>
                  </div>
                </div>

                <div className="info">
                  <div className="wine-header">
                    <div className="flag-box" aria-hidden="true">
                      <Flag country={v.pais} />
                    </div>

                    <div>
                      <h2 className="wine-name">{v.nome}</h2>
                      <div className="wine-region">{v.regiao}</div>
                    </div>
                  </div>

                  <Stars value={ratings[v.nome] ?? 0} readOnly={!(isEditMode && unlocked)} onChange={(val) => setRating(v.nome, val)} />

                  <div className="poetic-desc">{v.poesia}</div>

                  {/* Infos técnicas */}
                  <div className="tech-grid">
                    <div className="tech-item">
                      <span className="tech-emoji" aria-hidden="true">
                        🍇
                      </span>
                      <span>{v.uvas}</span>
                    </div>

                    <div className="tech-item">
                      <span className="tech-emoji" aria-hidden="true">
                        🗓️
                      </span>
                      <span>Safra: {v.safra}</span>
                    </div>

                    <div className="tech-item">
                      <span className="tech-emoji" aria-hidden="true">
                        💧
                      </span>
                      <span>Vol: {formatAbv(v.abv)}</span>
                    </div>

                    <div className="tech-item tech-item--full">
                      <span className="tech-emoji" aria-hidden="true">
                        🍽️
                      </span>
                      <span>
                        <strong>Combina com:</strong> {harmonizaText}
                      </span>
                    </div>
                  </div>

                  {/* Barra corpo/força */}
                  <div className="strength-wrapper">
                    <div className="strength-label">
                      <span>Corpo</span>
                      <span>{forca}/5</span>
                    </div>

                    <div className="strength-track">
                      <div className="strength-fill" style={{ width: `${pctForca}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </main>

      {/* Tema (discreto no canto inferior esquerdo) */}
      <div className="no-print" style={themeBadgeStyle}>
        Tema: {currentTheme.name}
      </div>

      {/* FABs */}
      <div className="fab-container no-print" role="group" aria-label="Ações rápidas">
        <button className="fab" title="Guia rápido" onClick={openHelp}>
          ?
        </button>

        <button className="fab" title="Estatísticas" onClick={openDashboard} aria-label="Estatísticas">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
          </svg>
        </button>

        <button className="fab" title="Temas" onClick={toggleTheme}>
          🎨
        </button>
      </div>

      {/* Lightbox */}
      <Lightbox open={lb.open} slides={lb.slides} index={lb.index} onClose={closeLightbox} onPrev={lbPrev} onNext={lbNext} />

      {/* Modal Guia */}
      {isGuideOpen && <GuideModal onClose={closeHelp} />}

      {/* Modal Dashboard */}
      {isDashboardOpen && (
        <div className="modal no-print" style={{ display: 'flex' }} onClick={closeDashboard}>
          <div className="modal-content dashboard" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeDashboard}>
              &times;
            </span>

            <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: 30, fontFamily: 'var(--font-title)' }}>
              Dashboard Analítico
            </h2>

            <div className="bi-kpi-container">
              <div className="kpi-box">
                <div className="kpi-num">{dashboard.total}</div>
                <div className="kpi-label">Total rótulos</div>
              </div>

              <div className="kpi-box">
                <div className="kpi-num">{dashboard.countriesCount}</div>
                <div className="kpi-label">Países</div>
              </div>

              <div className="kpi-box">
                <div className="kpi-num">{dashboard.avgAbv.toFixed(1)}%</div>
                <div className="kpi-label">Álcool médio</div>
              </div>

              <div className="kpi-box">
                <div className="kpi-num">{dashboard.avgRating.toFixed(1)}</div>
                <div className="kpi-label">Rating médio ({dashboard.ratedCount})</div>
              </div>
            </div>

            <div className="bi-charts-row">
              <div className="bi-col">
                <div className="bi-chart-title">Origem (Top 3)</div>

                <div className="pie-container">
                  <div className="pie-chart" style={{ background: dashboard.pieBackground }} />
                </div>

                <div className="pie-legend">
                  {dashboard.top3.map((c, i) => {
                    const pct = dashboard.total ? Math.round((dashboard.countryCounts[c] / dashboard.total) * 100) : 0
                    const legendColors = ['var(--primary)', 'var(--accent)', '#888']
                    return (
                      <div className="legend-item" key={c}>
                        <span className="legend-color" style={{ background: legendColors[i] }} />
                        {c} ({pct}%)
                      </div>
                    )
                  })}

                  {dashboard.othersCount > 0 && (
                    <div className="legend-item">
                      <span className="legend-color" style={{ background: '#e6e6e6' }} />
                      Outros
                    </div>
                  )}
                </div>
              </div>

              <div className="bi-col">
                <div className="bi-chart-title">Top Uvas</div>

                {dashboard.topGrapes.map((g) => {
                  const pct = dashboard.total ? (g.count / dashboard.total) * 100 : 0
                  return (
                    <div className="stat-item" key={g.name}>
                      <div className="stat-name" title={g.name}>
                        {g.name}
                      </div>
                      <div className="stat-track">
                        <div className="stat-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="stat-val">{g.count}</div>
                    </div>
                  )
                })}

                <div className="bi-chart-title" style={{ marginTop: 18 }}>
                  Força (1–5)
                </div>

                {[5, 4, 3, 2, 1].map((k) => {
                  const val = dashboard.strengthCounts[k]
                  const pct = dashboard.total ? (val / dashboard.total) * 100 : 0
                  return (
                    <div className="stat-item" key={k}>
                      <div className="stat-name">{k} / 5</div>
                      <div className="stat-track">
                        <div className="stat-fill" style={{ width: `${pct}%`, background: 'var(--secondary)' }} />
                      </div>
                      <div className="stat-val">{val}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {isPinOpen && (
        <div className="modal no-print" style={{ display: 'flex' }} onClick={closePinModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closePinModal}>
              &times;
            </span>

            <h2 style={{ textAlign: 'center' }}>Desbloquear edição</h2>

            <div className="filter-bar">
              <input
                className="filter-input"
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') unlock()
                }}
              />
              <button className="action-btn" onClick={unlock}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
