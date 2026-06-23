'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { products, transactions } from '@/lib/db/schema'
import { eq, like, desc } from 'drizzle-orm'

export type ActionState = { success: boolean; message: string } | null

export async function addTransactionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const dateStr = formData.get('date') as string
  const productCode = formData.get('productCode') as string
  const type = formData.get('type') as '입고' | '출고' | '샘플출고'
  const quantity = parseInt(formData.get('quantity') as string, 10)
  const customer = formData.get('customer') as string
  const manager = formData.get('manager') as string
  const notes = (formData.get('notes') as string) ?? ''

  if (!dateStr || !productCode || !type || !quantity || !customer || !manager) {
    return { success: false, message: '모든 필수 항목을 입력해주세요.' }
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.code, productCode))
    .limit(1)

  if (!product) return { success: false, message: '제품을 찾을 수 없습니다.' }

  const date = new Date(dateStr)
  const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  const typeCode = type === '입고' ? 'IN' : type === '출고' ? 'OUT' : 'SMP'
  const prefix = `${yyyymm}-${typeCode}-`

  const [latest] = await db
    .select({ docNumber: transactions.docNumber })
    .from(transactions)
    .where(like(transactions.docNumber, `${prefix}%`))
    .orderBy(desc(transactions.docNumber))
    .limit(1)

  const nextNum = (latest ? parseInt(latest.docNumber.slice(prefix.length), 10) : 0) + 1
  const docNum = `${prefix}${String(nextNum).padStart(3, '0')}`

  const unitPrice = type === '입고' ? product.costPrice : product.salePrice
  const amount = type === '샘플출고' ? null : unitPrice * quantity

  try {
    await db.insert(transactions).values({
      date: dateStr,
      docNumber: docNum,
      productId: product.id,
      type,
      quantity,
      unitPrice: type === '샘플출고' ? null : unitPrice,
      amount,
      customer,
      manager,
      notes: notes || null,
    })
    revalidatePath('/')
    return { success: true, message: `${type} 기록이 저장됐습니다.` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류'
    return { success: false, message: `저장 실패: ${msg}` }
  }
}
