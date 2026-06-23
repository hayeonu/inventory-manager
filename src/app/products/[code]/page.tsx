import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { getProductDetail, getProductTransactions } from '@/lib/sheets'
import { TransactionList } from '@/components/TransactionList'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          재고 현황으로 돌아가기
        </Link>

        <Suspense fallback={<DetailSkeleton />}>
          <ProductContent code={code} />
        </Suspense>
      </div>
    </div>
  )
}

async function ProductContent({ code }: { code: string }) {
  const [product, initialTx] = await Promise.all([
    getProductDetail(code),
    getProductTransactions(code, 10, 0),
  ])

  if (!product) notFound()

  const monthLabels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const activeMonths = product.months
    .map((m, i) => ({ ...m, index: i }))
    .filter((m) => m.in > 0 || m.out > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${product.status === '정상' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {product.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoCard label="제품코드" value={product.code} />
        <InfoCard label="카테고리" value={product.category} />
        <InfoCard label="판매단가" value={`${product.salePrice.toLocaleString()}원`} />
        <InfoCard label="원가" value={`${product.costPrice.toLocaleString()}원`} />
        <InfoCard label="마진율" value={`${product.marginRate}%`} />
        <InfoCard label="전기이월" value={product.prevBalance.toLocaleString()} />
        <InfoCard label="현재재고" value={product.currentStock.toLocaleString()} highlight={product.shortage > 0} />
        <InfoCard label="적정재고" value={product.optimalStock.toLocaleString()} />
      </div>

      {activeMonths.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">월별 입출고 현황</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {activeMonths.map((m) => (
                    <th key={m.index} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {monthLabels[m.index]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {activeMonths.map((m) => (
                    <td key={m.index} className="whitespace-nowrap px-4 py-3 text-center text-xs text-gray-500">
                      <span className="text-green-600">+{m.in.toLocaleString()}</span>
                      {' / '}
                      <span className="text-red-500">-{m.out.toLocaleString()}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">입출고 내역</h2>
          <span className="text-xs text-gray-400">{initialTx.total}건</span>
        </div>
        <TransactionList
          code={code}
          initialRows={initialTx.rows}
          total={initialTx.total}
        />
      </div>
    </div>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
    </div>
  )
}
