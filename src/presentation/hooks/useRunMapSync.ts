import { useEffect } from 'react'
import { useRunViewModel } from '../viewmodels/useRunViewModel'
import { useMapViewModel } from '../viewmodels/useMapViewModel'

/**
 * ランVM→マップVM の購読設定（純粋な購読セットアップ）
 *
 * useRunViewModel の runData が idle → active に遷移したとき、
 * useMapViewModel.initialize() を呼び出してマップ状態を初期化する。
 *
 * 初期同期（マウント時点ですでに active な場合の処理）は呼び出し側の責務。
 *
 * @returns unsubscribe 関数（呼び出し側でクリーンアップする責務を持つ）
 *
 * @constraint **必ず useEffect 内でのみ呼び出し、返値の unsubscribe を
 *   クリーンアップ関数で実行すること。**
 *   React のライフサイクル外（モジュールトップレベル・イベントハンドラ等）で
 *   呼び出すと、コンポーネント破棄後も購読が残りメモリリークの原因となる。
 *   テスト以外のプロダクションコードでは useRunMapSync フックを使用すること。
 */
export function createRunMapSubscription(): () => void {
  return useRunViewModel.subscribe((state, prevState) => {
    if (state.runData.status === 'active' && prevState.runData.status !== 'active') {
      useMapViewModel.getState().initialize(state.runData.map)
    } else if (state.runData.status === 'idle' && prevState.runData.status === 'active') {
      useMapViewModel.getState().reset()
    }
  })
}

/**
 * useRunMapSync — ランVM・マップVM間の購読同期フック
 *
 * App.tsx のルートで一度だけ呼び出す。
 * - マウント時点ですでに active な場合は即時初期同期を行う
 * - コンポーネント破棄時（unmount）に購読を自動解除する
 *
 * 依存関係の向き: useRunViewModel → (subscribe) → useMapViewModel
 * useRunViewModel は useMapViewModel を直接 import しない。
 */
export function useRunMapSync(): void {
  useEffect(() => {
    // マウント時点ですでに active な場合の初期同期
    const currentState = useRunViewModel.getState()
    if (currentState.runData.status === 'active') {
      useMapViewModel.getState().initialize(currentState.runData.map)
    }

    const unsubscribe = createRunMapSubscription()
    return unsubscribe
  }, [])
}
