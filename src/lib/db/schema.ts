import {
  pgTable,
  serial,
  varchar,
  integer,
  text,
  date,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 30 }).notNull(),
  salePrice: integer('sale_price').notNull(),
  costPrice: integer('cost_price').notNull(),
  optimalStock: integer('optimal_stock').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    date: date('date').notNull(),
    docNumber: varchar('doc_number', { length: 20 }).notNull().unique(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    type: varchar('type', { length: 10 }).notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price'),
    amount: integer('amount'),
    customer: varchar('customer', { length: 100 }).notNull(),
    manager: varchar('manager', { length: 30 }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('transactions_product_date_idx').on(t.productId, t.date),
    index('transactions_date_idx').on(t.date),
  ],
)

export const inventoryBalances = pgTable(
  'inventory_balances',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    year: integer('year').notNull(),
    carryOver: integer('carry_over').notNull().default(0),
  },
  (t) => [unique('inventory_balances_product_year_unq').on(t.productId, t.year)],
)
