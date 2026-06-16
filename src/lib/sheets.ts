const SPREADSHEET_ID = '1PapqKYFmKefzI2X_61a6wg1yAohWBYlQLdbHK5ZyGLg'
const SHEET_GID = '28595725'

export type InventoryRow = {
  productCode: string
  productName: string
  category: string
  prevBalance: number
  jan: { in: number; out: number }
  feb: { in: number; out: number }
  mar: { in: number; out: number }
  apr: { in: number; out: number }
  may: { in: number; out: number }
  currentStock: number
  optimalStock: number
  shortage: number
  status: string
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') {
      field += ch
    }
  }
  if (row.length > 0 || field) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0
  return parseInt(val.replace(/,/g, ''), 10) || 0
}

export async function getInventoryData(): Promise<InventoryRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(
      `스프레드시트 조회 실패 (HTTP ${res.status}). 시트가 "링크가 있는 모든 사용자" 공유로 설정되어 있는지 확인하세요.`
    )
  }

  const text = await res.text()
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  return rows
    .slice(1)
    .filter((row) => row[0]?.startsWith('PRD'))
    .map((row) => ({
      productCode: row[0] ?? '',
      productName: row[1] ?? '',
      category: row[2] ?? '',
      prevBalance: parseNumber(row[3]),
      jan: { in: parseNumber(row[4]), out: parseNumber(row[5]) },
      feb: { in: parseNumber(row[6]), out: parseNumber(row[7]) },
      mar: { in: parseNumber(row[8]), out: parseNumber(row[9]) },
      apr: { in: parseNumber(row[10]), out: parseNumber(row[11]) },
      may: { in: parseNumber(row[12]), out: parseNumber(row[13]) },
      currentStock: parseNumber(row[14]),
      optimalStock: parseNumber(row[15]),
      shortage: parseNumber(row[16]),
      status: row[17] ?? '',
    }))
}
