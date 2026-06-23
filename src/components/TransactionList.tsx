'use client'

import { useState, useTransition } from 'react'
import { loadMoreTransactions } from '@/app/actions'
import type { TransactionRow } from '@/lib/sheets'

export function TransactionList({
  code,
  initialRows,
  total,
}: {
  code: string
  initialRows: TransactionRow[]
  total: number
}) {
  const [rows, setRows] = useState(initialRows)
  const [isPending, startTransition] = useTransition()
  const hasMore = rows.length < total

  function handleLoadMore() {
    startTransition(async () => {
      const result = await loadMoreTransactions(code, rows.length)
      setRows((prev) => [...prev, ...result.rows])
    })
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        입출고 내역이 없습니다.
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <Th>날짜</Th>
              <Th>전표번호</Th>
              <Th>구분</Th>
              <Th align="right">수량</Th>
              <Th align="right">단가</Th>
              <Th align="right">금액</Th>
              <Th>거래처</Th>
              <Th>담당자</Th>
              <Th>비고</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{tx.date}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-500">{tx.docNumber}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <TypeBadge type={tx.type} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                  {tx.quantity.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                  {tx.unitPrice != null ? `${tx.unitPrice.toLocaleString()}원` : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {tx.amount != null ? `${tx.amount.toLocaleString()}원` : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{tx.customer}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{tx.manager}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-400">{tx.notes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="border-t border-gray-100 px-4 py-3 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isPending ? '불러오는 중...' : `더보기 (${rows.length} / ${total})`}
          </button>
        </div>
      )}
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  )
}

function TypeBadge({ type }: { type: string }) {
  const styles =
    type === '입고'
      ? 'bg-blue-100 text-blue-700'
      : type === '출고'
        ? 'bg-orange-100 text-orange-700'
        : 'bg-purple-100 text-purple-700'

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {type}
    </span>
  )
}
