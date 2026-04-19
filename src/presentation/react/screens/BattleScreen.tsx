import React from 'react'
import { useBattleViewModel } from '../../viewmodels/useBattleViewModel'

/**
 * presentation 層で使用する状態効果の最小ビュー型。
 * domain/entities/StatusEffect を直接 import せず、必要なフィールドのみを宣言する。
 */
type StatusEffectView = {
  readonly id: string
  readonly type: string
  readonly name: string
  readonly stacks: number
  readonly duration: number
}

/**
 * 状態効果アイコン
 *
 * スタック型は stacks、持続ターン型は duration を表示する。
 */
function StatusIcon({ effect }: { effect: StatusEffectView }): React.JSX.Element | null {
  const value = effect.stacks > 0 ? effect.stacks : effect.duration
  if (value === 0) return null
  return (
    <span
      title={effect.name}
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        margin: '0 2px',
        background: '#444',
        border: '1px solid #aaa',
        borderRadius: 4,
        fontSize: 12,
        color: '#fff',
      }}
    >
      {effect.type}:{value}
    </span>
  )
}

/**
 * BattleScreen — 戦闘画面（React オーバーレイ）
 *
 * useBattleViewModel からプレイヤー・敵の HP / ブロック / 状態効果を読み取り、
 * ステータスアイコンとして表示する（AC3）。
 *
 * 参照可能な層: presentation のみ
 */
export function BattleScreen(): React.JSX.Element {
  const { battleData } = useBattleViewModel()

  if (battleData.status !== 'active') {
    return (
      <div style={{ color: '#fff', padding: 16 }}>
        {battleData.status === 'error'
          ? `エラー: ${battleData.reason.join(', ')}`
          : '戦闘データ読み込み中...'}
      </div>
    )
  }

  const { player, enemies } = battleData

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 16,
        pointerEvents: 'none',
        color: '#fff',
        fontFamily: 'monospace',
      }}
    >
      {/* 敵エリア */}
      <div style={{ display: 'flex', gap: 16 }}>
        {enemies.map((enemy) => (
          <div
            key={enemy.id}
            style={{ background: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 4 }}
          >
            <div style={{ fontWeight: 'bold' }}>{enemy.name}</div>
            <div>
              HP: {enemy.health.current}/{enemy.health.max}
            </div>
            <div>ブロック: {enemy.block.value}</div>
            {enemy.statusEffects.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {enemy.statusEffects.map((se) => (
                  <StatusIcon key={se.id} effect={se} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* プレイヤーエリア */}
      <div
        style={{
          background: 'rgba(0,0,0,0.6)',
          padding: 8,
          borderRadius: 4,
          alignSelf: 'flex-start',
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{player.name}</div>
        <div>
          HP: {player.health.current}/{player.health.max}
        </div>
        <div>ブロック: {player.block.value}</div>
        {player.statusEffects.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {player.statusEffects.map((se) => (
              <StatusIcon key={se.id} effect={se} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
