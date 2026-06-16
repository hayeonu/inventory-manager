import { google } from 'googleapis'
import { PRODUCTS } from '@/lib/constants'

const SPREADSHEET_ID = '1PapqKYFmKefzI2X_61a6wg1yAohWBYlQLdbHK5ZyGLg'
const INVENTORY_SHEET_GID = 28595725

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

function parseNumber(val: string | undefined): number {
  if (!val) return 0
  return parseInt(val.replace(/,/g, ''), 10) || 0
}

let cachedSheetTitle: string | null = null

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function getSheetTitle(): Promise<string> {
  if (cachedSheetTitle) return cachedSheetTitle
  const sheets = await getSheetsClient()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.sheetId === INVENTORY_SHEET_GID
  )
  if (!sheet?.properties?.title) {
    throw new Error(`시트를 찾을 수 없습니다 (gid: ${INVENTORY_SHEET_GID})`)
  }
  cachedSheetTitle = sheet.properties.title
  return cachedSheetTitle
}

export async function getInventoryData(): Promise<InventoryRow[]> {
  const sheets = await getSheetsClient()
  const title = await getSheetTitle()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${title}!A1:R15`,
  })

  const rows = res.data.values
  if (!rows || rows.length < 2) return []

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

export async function appendTransaction(row: (string | number)[]): Promise<void> {
  const sheets = await getSheetsClient()
  const title = await getSheetTitle()

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${title}!A:K`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}
