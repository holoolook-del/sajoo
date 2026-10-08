import { BRANCH_RELATIONS, type BranchRelation } from '../content/fortune.ts';

export type { BranchRelation };

/** 지지 두 글자의 관계 — 우선순위: 육합→삼합→충→형→해→원진→파 */
export function branchRelation(a: string, b: string): BranchRelation | null {
  for (const { kind, pairs } of BRANCH_RELATIONS) {
    if (pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
      return kind;
    }
  }
  return null;
}
