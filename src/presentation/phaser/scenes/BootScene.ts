import Phaser from 'phaser'

/**
 * BootScene — アセットプリロードシーン
 *
 * ゲーム起動時に全アセット（画像・音声）をプリロードし、
 * 完了後に次のシーンへ遷移する。
 *
 * 参照可能な層: presentation のみ（domain/application/infrastructure は参照禁止）
 */

// ローディングバーの寸法定数
// progressBar は progressBox の内側に LOADING_BAR_PADDING px ずつ余白を持って配置される。
const LOADING_BAR_WIDTH = 320
const LOADING_BAR_HEIGHT = 50
const LOADING_BAR_PADDING = 10

export class BootScene extends Phaser.Scene {
  /** 遷移先シーンのキー。PhaserGame 呼び出し側が差し替え可能にするためコンストラクタで受け取る。 */
  private readonly nextScene: string

  private progressBar: Phaser.GameObjects.Graphics | null = null
  private progressBox: Phaser.GameObjects.Graphics | null = null
  private loadingText: Phaser.GameObjects.Text | null = null

  // TODO: SceneKey 定数が定義されたら 'MainMenuScene' をその値に置き換える。
  constructor(nextScene = 'MainMenuScene') {
    super({ key: 'BootScene' })
    this.nextScene = nextScene
  }

  preload(): void {
    this.createLoadingBar()
    this.setupLoaderEvents()

    // ---- アセット登録 ----
    // TODO: 実アセットが確定したら以下を置き換える。
    // 現時点ではアセットが存在しないためロードをスキップし、
    // create() で即座に次のシーンへ遷移する。
    //
    // 例（将来実装時）:
    //   this.load.image('card_back', 'assets/images/card_back.png')
    //   this.load.audio('bgm_menu', ['assets/audio/menu.mp3', 'assets/audio/menu.ogg'])
  }

  create(): void {
    this.cleanupLoadingBar()
    this.scene.start(this.nextScene)
  }

  /** シーン停止時（外部から stop / 遷移時）のクリーンアップ。 */
  shutdown(): void {
    this.removeLoaderListeners()
    this.cleanupLoadingBar()
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private createLoadingBar(): void {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2

    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222222, 0.8)
    this.progressBox.fillRect(
      cx - LOADING_BAR_WIDTH / 2,
      cy - LOADING_BAR_HEIGHT / 2,
      LOADING_BAR_WIDTH,
      LOADING_BAR_HEIGHT,
    )

    this.progressBar = this.add.graphics()

    this.loadingText = this.add
      .text(cx, cy - LOADING_BAR_HEIGHT, 'Loading...', {
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
  }

  private setupLoaderEvents(): void {
    const { width, height } = this.scale
    const cx = width / 2
    const cy = height / 2

    const innerWidth = LOADING_BAR_WIDTH - LOADING_BAR_PADDING * 2
    const innerHeight = LOADING_BAR_HEIGHT - LOADING_BAR_PADDING * 2

    this.load.on('progress', (value: number) => {
      this.progressBar?.clear()
      this.progressBar?.fillStyle(0xffffff, 1)
      this.progressBar?.fillRect(
        cx - innerWidth / 2,
        cy - innerHeight / 2,
        innerWidth * value,
        innerHeight,
      )
    })

    this.load.on('complete', () => {
      this.cleanupLoadingBar()
    })
  }

  private removeLoaderListeners(): void {
    this.load.off('progress')
    this.load.off('complete')
  }

  private cleanupLoadingBar(): void {
    this.progressBar?.destroy()
    this.progressBox?.destroy()
    this.loadingText?.destroy()
    this.progressBar = null
    this.progressBox = null
    this.loadingText = null
  }
}
