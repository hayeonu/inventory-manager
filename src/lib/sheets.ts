import { db } from '@/lib/db'
import { products, transactions, inventoryBalances } from '@/lib/db/schema'
import { eq, and, gte, lt } from 'drizzle-orm'

export type InventoryRow = {
  productCode: string
  productName: string
  category: string
  prevBalance: number
  months: { in: number; out: number }[]
  currentStock: number
  optimalStock: number
  shortage: number
  status: string
}

export async function getInventoryData(): Promise<InventoryRow[]> {
  const year = new Date().getFullYear()
  const startDate = `${year}-01-01`
  const endDate = `${year + 1}-01-01`

  const [allProducts, allBalances, allTransactions] = await Promise.all([
    db.select().from(products).orderBy(products.code),
    db.select().from(inventoryBalances).where(eq(inventoryBalances.year, year)),
    db
      .select({
        productId: transactions.productId,
        date: transactions.date,
        type: transactions.type,
        quantity: transactions.quantity,
      })
      .from(transactions)
      .where(and(gte(transactions.date, startDate), lt(transactions.date, endDate))),
  ])

  const balanceMap = new Map(allBalances.map((b) => [b.productId, b.carryOver]))

  return allProducts.map((p) => {
    const txs = allTransactions.filter((t) => t.productId === p.id)

    const months: { in: number; out: number }[] = Array.from({ length: 12 }, () => ({
      in: 0,
      out: 0,
    }))

    for (const t of txs) {
      const m = parseInt(t.date.split('-')[1], 10) - 1
      if (t.type === '입고') {
        months[m].in += t.quantity
      } else {
        months[m].out += t.quantity
      }
    }

    const prevBalance = balanceMap.get(p.id) ?? 0
    const totalIn = months.reduce((s, m) => s + m.in, 0)
    const totalOut = months.reduce((s, m) => s + m.out, 0)
    const currentStock = prevBalance + totalIn - totalOut
    const shortage = Math.max(0, p.optimalStock - currentStock)

    return {
      productCode: p.code,
      productName: p.name,
      category: p.category,
      prevBalance,
      months,
      currentStock,
      optimalStock: p.optimalStock,
      shortage,
      status: shortage > 0 ? '부족' : '정상',
    }
  })
}
