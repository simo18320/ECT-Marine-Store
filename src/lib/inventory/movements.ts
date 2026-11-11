import type { Database } from "@/types/database";

type MovementType = Database["public"]["Enums"]["inventory_movement_type"];

/**
 * The manual stock operations an admin can record. The database trigger applies a movement as:
 * purchase / return / transfer add, sale / damage subtract, and an adjustment is signed as stored
 * (so a decrease is stored with a negative quantity).
 */
export type MovementKind =
  | "manual_sale"
  | "damage"
  | "correction_decrease"
  | "correction_increase"
  | "purchase"
  | "return"
  | "transfer_in";

interface KindRule {
  label: string;
  movementType: MovementType;
  /** -1 removes from stock, +1 adds to it. */
  direction: -1 | 1;
  /** Corrections and write-offs must say why, for the audit trail. */
  noteRequired: boolean;
}

export const MOVEMENT_KINDS: Record<MovementKind, KindRule> = {
  manual_sale: { label: "Manual sale / shipped outside the shop (−)", movementType: "sale", direction: -1, noteRequired: false },
  damage: { label: "Damaged or lost (−)", movementType: "damage", direction: -1, noteRequired: true },
  correction_decrease: { label: "Stock correction: remove (−)", movementType: "adjustment", direction: -1, noteRequired: true },
  correction_increase: { label: "Stock correction: add (+)", movementType: "adjustment", direction: 1, noteRequired: true },
  purchase: { label: "Goods received / purchase (+)", movementType: "purchase", direction: 1, noteRequired: false },
  return: { label: "Customer return (+)", movementType: "return", direction: 1, noteRequired: false },
  transfer_in: { label: "Transfer in (+)", movementType: "transfer", direction: 1, noteRequired: false },
};

export function isMovementKind(value: string): value is MovementKind {
  return value in MOVEMENT_KINDS;
}

export interface ResolvedMovement {
  movementType: MovementType;
  /** What is written to inventory_movements.quantity. */
  storedQuantity: number;
  /** Net change to current stock. */
  delta: number;
  noteRequired: boolean;
}

export function resolveMovement(kind: MovementKind, quantity: number): ResolvedMovement {
  const rule = MOVEMENT_KINDS[kind];
  const delta = rule.direction * quantity;
  return {
    movementType: rule.movementType,
    // sale and damage are subtracted by the trigger itself, so they are stored positive;
    // an adjustment is applied as entered, so a decrease is stored negative.
    storedQuantity: rule.movementType === "adjustment" ? delta : quantity,
    delta,
    noteRequired: rule.noteRequired,
  };
}

/** The change a stored movement made to stock, for display ("−2", "+10"). */
export function storedMovementDelta(movementType: string, quantity: number): number {
  if (movementType === "sale" || movementType === "damage") return -Math.abs(quantity);
  return quantity;
}

/**
 * Removing more than is on hand is almost always a typo, so it is refused. The one exception is a product
 * sold as "available in 3 working days": it is allowed to go negative, which is the signal to reorder it.
 */
export function removalError(stockBefore: number, delta: number, backorderable: boolean): string | null {
  if (delta >= 0 || backorderable) return null;
  if (stockBefore + delta >= 0) return null;
  return `Only ${Math.max(0, stockBefore)} in stock: you cannot remove ${Math.abs(delta)}.`;
}
