import React from 'react'
import { PHASER_BACKGROUND_COLOR } from '../../../shared/constants'

type Props = {
  onNewGame: () => void
  hasSaveData?: boolean
  onContinue?: () => void
}

/**
 * TitleScreen — タイトル画面
 *
 * ゲーム起動時に最初に表示される画面。
 * 「新しいゲーム」でキャラクター選択へ遷移する。
 * セーブデータが存在する場合のみ「続きから」ボタンを表示する。
 *
 * 参照してよい層: presentation/viewmodels のみ
 */
export function TitleScreen({
  onNewGame,
  hasSaveData = false,
  onContinue,
}: Props): React.JSX.Element {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>XxxTheSpire</h1>
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={onNewGame}>
          新しいゲーム
        </button>
        {hasSaveData && onContinue !== undefined && (
          <button style={styles.button} onClick={onContinue}>
            続きから
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: PHASER_BACKGROUND_COLOR,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '2rem',
    letterSpacing: '0.1em',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    alignItems: 'center',
  },
  button: {
    padding: '0.75rem 2rem',
    fontSize: '1.1rem',
    backgroundColor: '#2a2a4e',
    color: '#ffffff',
    border: '1px solid #4a4a8e',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '200px',
  },
} as const
