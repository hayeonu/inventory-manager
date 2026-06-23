import { db } from '@/lib/db'
import { products, transactions, inventoryBalances } from '@/lib/db/schema'
import { eq, and, gte, lt, desc } from 'drizzle-orm'

export type ProductDetail = {
  code: string
  name: string
  category: string
  salePrice: number
  costPrice: number
  marginRate: number
  optimalStock: number
  currentStock: number
  prevBalance: number
  shortage: number
  status: string
  months: { in: number; out: number }[]
}

export type TransactionRow = {
  id: number
  date: string
  docNumber: string
  type: string
  quantity: number
  unitPrice: number | null
  amount: number | null
  customer: string
  manager: string
  notes: string | null
}

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

export async function getProductDetail(code: string): Promise<ProductDetail | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.code, code))
    .limit(1)

  if (!product) return null

  const year = new Date().getFullYear()
  const startDate = `${year}-01-01`
  const endDate = `${year + 1}-01-01`

  const [balances, txs] = await Promise.all([
    db
      .select()
      .from(inventoryBalances)
      .where(and(eq(inventoryBalances.productId, product.id), eq(inventoryBalances.year, year))),
    db
      .select({
        date: transactions.date,
        type: transactions.type,
        quantity: transactions.quantity,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.productId, product.id),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate),
        ),
      ),
  ])

  const prevBalance = balances[0]?.carryOver ?? 0
  const months: { in: number; out: number }[] = Array.from({ length: 12 }, () => ({ in: 0, out: 0 }))

  for (const t of txs) {
    const m = parseInt(t.date.split('-')[1], 10) - 1
    if (t.type === '입고') {
      months[m].in += t.quantity
    } else {
      months[m].out += t.quantity
    }
  }

  const totalIn = months.reduce((s, m) => s + m.in, 0)
  const totalOut = months.reduce((s, m) => s + m.out, 0)
  const currentStock = prevBalance + totalIn - totalOut
  const shortage = Math.max(0, product.optimalStock - currentStock)
  const marginRate =
    product.salePrice > 0
      ? Math.round(((product.salePrice - product.costPrice) / product.salePrice) * 100)
      : 0

  return {
    code: product.code,
    name: product.name,
    category: product.category,
    salePrice: product.salePrice,
    costPrice: product.costPrice,
    marginRate,
    optimalStock: product.optimalStock,
    currentStock,
    prevBalance,
    shortage,
    status: shortage > 0 ? '부족' : '정상',
    months,
  }
}

export async function getProductTransactions(
  code: string,
  limit: number,
  offset: number,
): Promise<{ rows: TransactionRow[]; total: number }> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.code, code))
    .limit(1)

  if (!product) return { rows: [], total: 0 }

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: transactions.id,
        date: transactions.date,
        docNumber: transactions.docNumber,
        type: transactions.type,
        quantity: transactions.quantity,
        unitPrice: transactions.unitPrice,
        amount: transactions.amount,
        customer: transactions.customer,
        manager: transactions.manager,
        notes: transactions.notes,
      })
      .from(transactions)
      .where(eq(transactions.productId, product.id))
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(limit)
      .offset(offset),
    db.$count(transactions, eq(transactions.productId, product.id)),
  ])

  return { rows, total: Number(countResult) }
}
