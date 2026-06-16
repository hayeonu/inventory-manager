import { getInventoryData, type InventoryRow } from '@/lib/sheets'
import { AddTransactionForm } from '@/components/AddTransactionForm'
import { Suspense } from 'react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">재고 현황</h1>
            <p className="mt-1 text-sm text-gray-500">라로제 제품 현재 재고 조회</p>
          </div>
          <AddTransactionForm />
        </div>
        <Suspense fallback={<TableSkeleton />}>
          <InventorySection />
        </Suspense>
      </div>
    </div>
  )
}

async function InventorySection() {
  let inventory: InventoryRow[] = []
  let errorMessage: string | null = null

  try {
    inventory = await getInventoryData()
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.'
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-800">오류: {errorMessage}</p>
        <p className="mt-1 text-xs text-red-600">.env.local 파일의 Google API 자격증명을 확인하세요.</p>
      </div>
    )
  }

  const totalStock = inventory.reduce((s, r) => s + r.currentStock, 0)
  const shortageCount = inventory.filter((r) => r.shortage > 0).length
  const normalCount = inventory.filter((r) => r.status === '정상').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="전체 제품 수" value={`${inventory.length}개`} />
        <StatCard label="총 재고 수량" value={totalStock.toLocaleString()} />
        <StatCard
          label="정상 상태"
          value={`${normalCount} / ${inventory.length}`}
          highlight={shortageCount > 0}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>제품코드</Th>
                <Th>제품명</Th>
                <Th>카테고리</Th>
                <Th align="right">전기이월</Th>
                <Th align="right">1월 입/출고</Th>
                <Th align="right">2월 입/출고</Th>
                <Th align="right">3월 입/출고</Th>
                <Th align="right">4월 입/출고</Th>
                <Th align="right">5월 입/출고</Th>
                <Th align="right">현재재고</Th>
                <Th align="right">적정재고</Th>
                <Th align="right">부족수량</Th>
                <Th align="center">상태</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {inventory.map((item) => (
                <tr key={item.productCode} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-gray-500">
                    {item.productCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {item.productName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {item.category}
                  </td>
                  <Td>{item.prevBalance.toLocaleString()}</Td>
                  <MonthCell item={item.jan} />
                  <MonthCell item={item.feb} />
                  <MonthCell item={item.mar} />
                  <MonthCell item={item.apr} />
                  <MonthCell item={item.may} />
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-blue-700">
                    {item.currentStock.toLocaleString()}
                  </td>
                  <Td>{item.optimalStock.toLocaleString()}</Td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium ${item.shortage > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {item.shortage > 0 ? item.shortage.toLocaleString() : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
          Google Sheets에서 실시간 조회 · {new Date().toLocaleString('ko-KR')}
        </div>
      </div>
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${alignClass}`}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
      {children}
    </td>
  )
}

function MonthCell({ item }: { item: { in: number; out: number } }) {
  return (
    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500">
      <span className="text-green-600">+{item.in.toLocaleString()}</span>
      {' / '}
      <span className="text-red-500">-{item.out.toLocaleString()}</span>
    </td>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isNormal = status === '정상'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${isNormal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {status}
    </span>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
    </div>
  )
}
