import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRunViewModel } from '../../../src/presentation/viewmodels/useRunViewModel'
import type { RunData } from '../../../src/presentation/viewmodels/useRunViewModel'
import { ScreenType } from '../../../src/shared/types/ScreenType'

// --- Mocks ---

vi.mock('../../../src/di/container', () => ({
  createContainer: vi.fn(),
}))

import { createContainer } from '../../../src/di/container'
import { MOCK_MAP, MOCK_PLAYER } from '../__helpers__'

function makeSuccessContainer() {
  return {
    startRunUseCase: {
      execute: vi.fn().mockReturnValue({
        ok: true,
        value: { player: MOCK_PLAYER, map: MOCK_MAP },
      }),
    },
  }
}

function makeFailureContainer(error: string) {
  return {
    startRunUseCase: {
      execute: vi.fn().mockReturnValue({ ok: false, error }),
    },
  }
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  // Zustand ストアを初期状態にリセット（アクション関数は保持されるため merge で OK）
  useRunViewModel.setState({
    runData: { status: 'idle' },
    startRunError: null,
    isStarting: false,
  })
})

// --- Tests ---

describe('useRunViewModel', () => {
  describe('初期状態', () => {
    it('1. runData.status が "idle" であること', () => {
      const { runData } = useRunViewModel.getState()
      expect(runData.status).toBe('idle')
    })

    it('2. startRunError が null であること', () => {
      const { startRunError } = useRunViewModel.getState()
      expect(startRunError).toBeNull()
    })

    it('3. isStarting が false であること', () => {
      const { isStarting } = useRunViewModel.getState()
      expect(isStarting).toBe(false)
    })

    it('4. idle 状態では player・map・currentScreen にアクセス不可（TypeScript 型で保証）', () => {
      const { runData } = useRunViewModel.getState()
      // idle 状態では status === 'idle' の narrowing が必要。
      // アクセスしようとすると TypeScript コンパイルエラーになる（実行時は型チェックで防ぐ）。
      expect(runData.status).toBe('idle')
      if (runData.status === 'active') {
        // このブロックは実行されない（idle 状態のため）
        expect(runData.player).toBeDefined()
      }
    })
  })

  describe('startRun — 正常系', () => {
    beforeEach(() => {
      vi.mocked(createContainer).mockReturnValue(
        makeSuccessContainer() as unknown as ReturnType<typeof createContainer>,
      )
    })

    it('5. startRun 後に runData.status が "active" になること', () => {
      useRunViewModel.getState().startRun('ironclad')
      const { runData } = useRunViewModel.getState()
      expect(runData.status).toBe('active')
    })

    it('6. active 状態では runData.player が存在すること', () => {
      useRunViewModel.getState().startRun('ironclad')
      const { runData } = useRunViewModel.getState()
      if (runData.status !== 'active') throw new Error('Expected active')
      expect(runData.player.id).toBe('ironclad')
    })

    it('7. active 状態では runData.map が存在すること', () => {
      useRunViewModel.getState().startRun('ironclad')
      const { runData } = useRunViewModel.getState()
      if (runData.status !== 'active') throw new Error('Expected active')
      expect(Array.isArray(runData.map)).toBe(true)
      expect(runData.map.length).toBeGreaterThan(0)
    })

    it('8. active 状態では runData.currentScreen が ScreenType.Map であること', () => {
      useRunViewModel.getState().startRun('ironclad')
      const { runData } = useRunViewModel.getState()
      if (runData.status !== 'active') throw new Error('Expected active')
      expect(runData.currentScreen).toBe(ScreenType.Map)
    })

    it('9. startRun 成功後に startRunError が null であること', () => {
      useRunViewModel.getState().startRun('ironclad')
      expect(useRunViewModel.getState().startRunError).toBeNull()
    })

    it('10. startRun 成功後に isStarting が false であること', () => {
      useRunViewModel.getState().startRun('ironclad')
      expect(useRunViewModel.getState().isStarting).toBe(false)
    })
  })

  describe('startRun — 異常系', () => {
    beforeEach(() => {
      vi.mocked(createContainer).mockReturnValue(
        makeFailureContainer('unknown character') as unknown as ReturnType<typeof createContainer>,
      )
    })

    it('11. 失敗時に runData.status が "idle" のまま変わらないこと', () => {
      useRunViewModel.getState().startRun('silent')
      const { runData } = useRunViewModel.getState()
      expect(runData.status).toBe('idle')
    })

    it('12. 失敗時に startRunError がセットされること', () => {
      useRunViewModel.getState().startRun('silent')
      expect(useRunViewModel.getState().startRunError).toBe('unknown character')
    })

    it('13. 失敗時に isStarting が false に戻ること', () => {
      useRunViewModel.getState().startRun('silent')
      expect(useRunViewModel.getState().isStarting).toBe(false)
    })
  })

  describe('navigateTo', () => {
    it('14. idle 状態で navigateTo を呼んでも runData が変わらないこと', () => {
      useRunViewModel.getState().navigateTo(ScreenType.Map)
      const { runData } = useRunViewModel.getState()
      expect(runData.status).toBe('idle')
    })

    it('15. active 状態で navigateTo すると runData.currentScreen が変更されること', () => {
      vi.mocked(createContainer).mockReturnValue(
        makeSuccessContainer() as unknown as ReturnType<typeof createContainer>,
      )
      useRunViewModel.getState().startRun('ironclad')
      // 初期値は Map なので別の画面（Combat）に遷移して変化を確認する
      useRunViewModel.getState().navigateTo(ScreenType.Combat)
      const { runData } = useRunViewModel.getState()
      if (runData.status !== 'active') throw new Error('Expected active')
      expect(runData.currentScreen).toBe(ScreenType.Combat)
    })
  })

  describe('clearError', () => {
    it('16. clearError で startRunError が null になること', () => {
      vi.mocked(createContainer).mockReturnValue(
        makeFailureContainer('unknown character') as unknown as ReturnType<typeof createContainer>,
      )
      useRunViewModel.getState().startRun('silent')
      expect(useRunViewModel.getState().startRunError).not.toBeNull()

      useRunViewModel.getState().clearError()
      expect(useRunViewModel.getState().startRunError).toBeNull()
    })
  })

  describe('二重起動防止', () => {
    it('17. isStarting 中に startRun を呼んでも createContainer が1回しか呼ばれないこと', () => {
      // isStarting を手動で true にした状態でテスト
      useRunViewModel.setState({ isStarting: true })
      vi.mocked(createContainer).mockReturnValue(
        makeSuccessContainer() as unknown as ReturnType<typeof createContainer>,
      )
      useRunViewModel.getState().startRun('ironclad')
      expect(createContainer).not.toHaveBeenCalled()
    })

    it('R-3. active 状態から startRun を再度呼んだとき isStarting ガードが機能すること', () => {
      vi.mocked(createContainer).mockReturnValue(
        makeSuccessContainer() as unknown as ReturnType<typeof createContainer>,
      )
      // 先に active にしてから isStarting を true にセット
      useRunViewModel.getState().startRun('ironclad')
      expect(useRunViewModel.getState().runData.status).toBe('active')

      useRunViewModel.setState({ isStarting: true })
      vi.clearAllMocks()

      useRunViewModel.getState().startRun('ironclad')
      expect(createContainer).not.toHaveBeenCalled()
    })
  })

  describe('clearError — エッジケース', () => {
    it('R-1. idle + startRunError=null の状態で clearError を呼んでも副作用が発生しないこと', () => {
      const stateBefore = useRunViewModel.getState()
      expect(stateBefore.startRunError).toBeNull()
      expect(stateBefore.runData.status).toBe('idle')

      useRunViewModel.getState().clearError()

      const stateAfter = useRunViewModel.getState()
      expect(stateAfter.startRunError).toBeNull()
      expect(stateAfter.runData.status).toBe('idle')
      expect(stateAfter.isStarting).toBe(false)
    })
  })

  describe('navigateTo — エッジケース', () => {
    it('R-2. idle で navigateTo を呼んでも startRunError・isStarting が変化しないこと', () => {
      // startRunError をセットしておく
      vi.mocked(createContainer).mockReturnValue(
        makeFailureContainer('error') as unknown as ReturnType<typeof createContainer>,
      )
      useRunViewModel.getState().startRun('silent')
      expect(useRunViewModel.getState().startRunError).toBe('error')

      useRunViewModel.getState().navigateTo(ScreenType.Map)

      expect(useRunViewModel.getState().startRunError).toBe('error')
      expect(useRunViewModel.getState().isStarting).toBe(false)
      expect(useRunViewModel.getState().runData.status).toBe('idle')
    })
  })
})

// TypeScript 型レベル検証（コンパイル時チェック）
// RunData が discriminated union として正しく機能していることを型レベルで検証する。
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _typeCheck(runData: RunData) {
  if (runData.status === 'active') {
    // active 状態では narrowing により player・map・currentScreen にアクセス可能
    const _player = runData.player
    const _map = runData.map
    const _screen = runData.currentScreen
    void _player
    void _map
    void _screen
  }
  // narrowing なしで player に直接アクセスしようとすると TypeScript コンパイルエラーになる:
  // @ts-expect-error RunData には player プロパティが直接存在しない（status 絞り込みが必要）
  const _illegalAccess = runData.player
  void _illegalAccess
}
