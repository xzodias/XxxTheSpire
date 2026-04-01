import { type Combat } from '../../domain/entities/Combat'
import { type CombatPhase } from './CombatPhase'

/**
 * 戦闘セッション（アプリケーション層）
 *
 * domain の Combat スナップショットと application 層が管理する CombatPhase を
 * 一つの型でまとめたラッパー。
 *
 * - Combat エンティティは純粋なゲーム状態（HP・手札・敵など）を保持する
 * - CombatPhase はオーケストレーション上の関心事として application 層で管理する
 * - ステートマシン・ユースケース・ViewModel はこの型を経由して戦闘状態を参照する
 *
 * 参照可能な層: application, infrastructure, presentation
 */
export interface CombatSession {
  readonly combat: Combat
  readonly phase: CombatPhase
}
