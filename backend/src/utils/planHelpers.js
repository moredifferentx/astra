import { getOne } from "../config/db.js"

const PLAN_TABLES = { coin: "plans_coin", real: "plans_real" }

export async function getPlan(planType, planId) {
  const table = PLAN_TABLES[planType]
  if (!table) return null
  return await getOne(`SELECT * FROM ${table} WHERE id = ?`, [planId])
}

export function getPurchasePrice(planType, plan) {
  if (planType === "coin") return plan.initial_price ?? plan.coin_price
  return plan.price
}

export function getRenewalPrice(planType, plan) {
  if (planType === "coin") return plan.renewal_price ?? plan.coin_price
  return plan.price
}

export function getBalanceField(planType) {
  return planType === "coin" ? "coins" : "balance"
}
