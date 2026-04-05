import React from 'react'
import { useRunViewModel } from '../../viewmodels/useRunViewModel'
import { PHASER_BACKGROUND_COLOR } from '../../../shared/constants'

type Props = {
  onBack: () => void
  error?: string | null
}

// 選択可能キャラクター定義（初期はIronclad）
const CHARACTERS = [
  {
    id: 'ironclad',
    name: 'Ironclad',
    description: '力強い戦士。攻撃と防御のバランスが取れたデッキを持つ。',
    startingDeck: 'Strike ×5 / Defend ×4 / Bash ×1',
  },
] as const

/**
 * CharacterSelectScreen — キャラクター選択画面
 *
 * プレイするキャラクターを選択し、ランを開始する。
 * 「選択」ボタン押下 → useRunViewModel.startRun(characterId) → マップ画面へ遷移
 *
 * 参照してよい層: presentation/viewmodels のみ
 */
export function CharacterSelectScreen({ onBack, error }: Props): React.JSX.Element {
  const { startRun, isStarting } = useRunViewModel()

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>キャラクター選択</h2>

      <div style={styles.characterList}>
        {CHARACTERS.map((char) => (
          <div key={char.id} style={styles.characterCard}>
            <h3 style={styles.characterName}>{char.name}</h3>
            <p style={styles.description}>{char.description}</p>
            <p style={styles.deckLabel}>初期デッキ: {char.startingDeck}</p>
            <button
              style={isStarting ? styles.buttonDisabled : styles.button}
              onClick={() => startRun(char.id)}
              disabled={isStarting}
            >
              {isStarting ? '開始中...' : '選択'}
            </button>
          </div>
        ))}
      </div>

      {error !== null && error !== undefined && <p style={styles.error}>エラー: {error}</p>}

      <button
        style={isStarting ? styles.backButtonDisabled : styles.backButton}
        onClick={onBack}
        disabled={isStarting}
      >
        ← 戻る
      </button>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: PHASER_BACKGROUND_COLOR,
    color: '#ffffff',
    fontFamily: 'monospace',
    padding: '2rem',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
  },
  characterList: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  characterCard: {
    backgroundColor: '#2a2a4e',
    border: '1px solid #4a4a8e',
    borderRadius: '8px',
    padding: '1.5rem',
    width: '260px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  characterName: {
    fontSize: '1.4rem',
    margin: 0,
  },
  description: {
    fontSize: '0.9rem',
    color: '#cccccc',
    margin: 0,
    lineHeight: 1.5,
  },
  deckLabel: {
    fontSize: '0.8rem',
    color: '#aaaaaa',
    margin: 0,
  },
  button: {
    padding: '0.6rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#3a3a6e',
    color: '#ffffff',
    border: '1px solid #5a5aae',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  buttonDisabled: {
    padding: '0.6rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#333355',
    color: '#777799',
    border: '1px solid #333355',
    borderRadius: '4px',
    cursor: 'not-allowed',
    marginTop: '0.5rem',
  },
  error: {
    color: '#ff6666',
    marginTop: '1rem',
  },
  backButton: {
    marginTop: '2rem',
    padding: '0.5rem 1.2rem',
    fontSize: '0.9rem',
    backgroundColor: 'transparent',
    color: '#aaaacc',
    border: '1px solid #4a4a8e',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  backButtonDisabled: {
    marginTop: '2rem',
    padding: '0.5rem 1.2rem',
    fontSize: '0.9rem',
    backgroundColor: 'transparent',
    color: '#555577',
    border: '1px solid #333355',
    borderRadius: '4px',
    cursor: 'not-allowed',
  },
} as const
