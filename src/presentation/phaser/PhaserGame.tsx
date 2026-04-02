import Phaser from 'phaser'
import React, { useEffect, useRef } from 'react'

import { PHASER_BACKGROUND_COLOR, PHASER_CANVAS_Z_INDEX } from '../../shared/constants'

// z-index structure:
//   z-index: 100 — dragging cards (React)
//   z-index: 10  — normal cards / UI overlay (React)
//   z-index: 5   — Phaser canvas (pointer-events: none)
//   z-index: 0   — background (React)

// Props intentionally restrict width/height to number (px only).
// Phaser.GameConfig accepts string (e.g. "100%") but relative sizing
// is not required in this project and would complicate canvas style management.
type Props = {
  scenes: Phaser.Types.Scenes.SceneType[]
  width?: number
  height?: number
}

export function PhaserGame({ scenes, width = 1280, height = 720 }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  // Stabilize scenes and canvas size so the effect runs only once on mount.
  // Callers must not rely on hot-swapping scenes or resizing after mount.
  const scenesRef = useRef(scenes)
  const widthRef = useRef(width)
  const heightRef = useRef(height)

  useEffect(() => {
    if (containerRef.current === null) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: widthRef.current,
      height: heightRef.current,
      parent: containerRef.current,
      backgroundColor: PHASER_BACKGROUND_COLOR,
      // Card operations are handled by React; disable Phaser input on canvas.
      input: {
        mouse: { preventDefaultWheel: false },
        touch: false,
      },
      scene: scenesRef.current,
    }

    const game = new Phaser.Game(config)

    // Ensure React UI events pass through the canvas.
    game.canvas.style.pointerEvents = 'none'
    // PHASER_CANVAS_Z_INDEX is the CSS z-index value (number) for the Phaser canvas layer.
    game.canvas.style.zIndex = String(PHASER_CANVAS_Z_INDEX)

    return () => {
      // destroy(true) removes the canvas from the DOM asynchronously on the next game loop tick.
      // No additional removeChild needed; Phaser handles DOM cleanup when removeCanvas=true.
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} style={{ position: 'relative', width, height }} />
}
