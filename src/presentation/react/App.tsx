import React, { useCallback, useState } from 'react'
import { PhaserGame } from '../phaser/PhaserGame'
import { BootScene } from '../phaser/scenes/BootScene'
import { MapScene } from '../phaser/scenes/MapScene'
import { SceneKey, PHASER_BACKGROUND_COLOR } from '../../shared/constants'
import { ScreenType } from '../../shared/types'
import { useRunViewModel } from '../viewmodels/useRunViewModel'
import { useRunMapSync } from '../hooks/useRunMapSync'
import { TitleScreen } from './screens/TitleScreen'
import { CharacterSelectScreen } from './screens/CharacterSelectScreen'
import { MapScreen } from './screens/MapScreen'
import { BattleScreen } from './screens/BattleScreen'

// ラン開始前の画面種別（useRunViewModel 管理外の UI フロー）
type PreRunScreen = 'title' | 'characterSelect'

/**
 * App — アプリケーションルートコンポーネント
 *
 * - ラン開始前: title → characterSelect の UI ナビゲーションを管理する
 * - ラン開始後: runData.currentScreen に応じてゲーム画面をレンダリングする
 * - Phaser キャンバス（PhaserGame）はマップ画面でのみ表示する
 *
 * 参照してよい層: presentation / shared
 * （DIコンテナは useRunViewModel 経由でのみ使用するため、この層では直接参照しない）
 */
export function App(): React.JSX.Element {
  useRunMapSync()

  // シーン配列はマウント時に一度だけ生成される（PhaserGame の仕様に従う）
  const [phaserScenes] = useState(() => [new BootScene(SceneKey.Map), new MapScene()])
  const [preRunScreen, setPreRunScreen] = useState<PreRunScreen>('title')
  const { runData, startRunError, clearError } = useRunViewModel()

  const isInRun = runData.status === 'active'

  // 戻るボタン: エラーをクリアしてタイトルに戻る
  const handleBackToTitle = useCallback(() => {
    clearError()
    setPreRunScreen('title')
  }, [clearError])

  if (!isInRun) {
    if (preRunScreen === 'title') {
      return <TitleScreen onNewGame={() => setPreRunScreen('characterSelect')} />
    }
    return <CharacterSelectScreen error={startRunError} onBack={handleBackToTitle} />
  }

  return (
    <div
      style={{
        position: 'relative',
        width: 1280,
        height: 720,
        backgroundColor: PHASER_BACKGROUND_COLOR,
      }}
    >
      {runData.currentScreen === ScreenType.Map && (
        <>
          <PhaserGame scenes={phaserScenes} />
          <MapScreen />
        </>
      )}
      {runData.currentScreen === ScreenType.Combat && <BattleScreen />}
    </div>
  )
}
