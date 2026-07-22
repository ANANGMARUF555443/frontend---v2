import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import {
  BACKGROUND_IMAGE_URL,
  BACKGROUND_FALLBACK_COLOR,
  BACKGROUND_OVERLAY_OPACITY,
  BACKGROUND_OVERLAY_COLOR,
  BACKGROUND_ANIMATION_ENABLED,
  BACKGROUND_PARTICLE_COUNT,
  BACKGROUND_PARTICLE_COLOR,
  BACKGROUND_PARTICLE_OPACITY,
  BACKGROUND_PARTICLE_SPEED,
} from '../constants/background'

// Background global untuk seluruh halaman.
//
// Strategi 2 lapis supaya TIDAK ADA JEDA saat refresh:
// 1) Lapisan CSS `background-image` biasa -> muncul instan, bersamaan
//    dengan browser mem-parsing HTML/CSS, tanpa menunggu JavaScript/PixiJS.
// 2) Lapisan canvas PixiJS transparan DI ATASNYA -> hanya untuk animasi
//    partikel/efek tambahan (bukan gambar utama), jadi kalaupun PixiJS
//    masih loading, gambar background sudah kelihatan duluan.
export default function PixiBackground({ imageUrl = BACKGROUND_IMAGE_URL }) {
  const canvasMountRef = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    if (!BACKGROUND_ANIMATION_ENABLED || !imageUrl) return

    let destroyed = false
    let particles = []
    let ticker

    const app = new PIXI.Application({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    })
    appRef.current = app

    if (canvasMountRef.current) {
      canvasMountRef.current.appendChild(app.view)
    }

    const container = new PIXI.Container()
    app.stage.addChild(container)

    const makeParticle = () => {
      const g = new PIXI.Graphics()
      const radius = 1 + Math.random() * 2.5
      // Syntax PixiJS v7 (beginFill/drawCircle/endFill), bukan API v8
      // (.circle().fill()) supaya kompatibel dengan pixi.js ^7.4.2 di package.json
      g.beginFill(
        PIXI.utils.string2hex(BACKGROUND_PARTICLE_COLOR),
        BACKGROUND_PARTICLE_OPACITY * (0.4 + Math.random() * 0.6)
      )
      g.drawCircle(0, 0, radius)
      g.endFill()
      g.x = Math.random() * app.screen.width
      g.y = Math.random() * app.screen.height
      g._speed = BACKGROUND_PARTICLE_SPEED * (0.5 + Math.random())
      g._drift = (Math.random() - 0.5) * 0.3
      return g
    }

    particles = Array.from({ length: BACKGROUND_PARTICLE_COUNT }, makeParticle)
    particles.forEach((p) => container.addChild(p))

    ticker = () => {
      for (const p of particles) {
        p.y -= p._speed
        p.x += p._drift
        if (p.y < -10) {
          p.y = app.screen.height + 10
          p.x = Math.random() * app.screen.width
        }
        if (p.x < -10) p.x = app.screen.width + 10
        if (p.x > app.screen.width + 10) p.x = -10
      }
    }
    app.ticker.add(ticker)

    return () => {
      destroyed = true
      if (ticker) app.ticker.remove(ticker)
      app.destroy(true, { children: true, texture: false })
      appRef.current = null
    }
  }, [imageUrl])

  if (!imageUrl) return null

  return (
    <>
      {/* Lapisan 1: CSS background image, tampil instan tanpa menunggu JS */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -2,
          backgroundColor: BACKGROUND_FALLBACK_COLOR,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
        }}
      />

      {/* Overlay gelap/terang tipis supaya teks tetap terbaca */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          backgroundColor: BACKGROUND_OVERLAY_COLOR,
          opacity: BACKGROUND_OVERLAY_OPACITY,
          pointerEvents: 'none',
        }}
      />

      {/* Lapisan 2: canvas PixiJS transparan, hanya untuk animasi partikel */}
      {BACKGROUND_ANIMATION_ENABLED && (
        <div
          ref={canvasMountRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  )
}
