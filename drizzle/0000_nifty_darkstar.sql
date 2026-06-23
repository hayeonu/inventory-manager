CREATE TABLE "inventory_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"year" integer NOT NULL,
	"carry_over" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "inventory_balances_product_year_unq" UNIQUE("product_id","year")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(30) NOT NULL,
	"sale_price" integer NOT NULL,
	"cost_price" integer NOT NULL,
	"optimal_stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"doc_number" varchar(20) NOT NULL,
	"product_id" integer NOT NULL,
	"type" varchar(10) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer,
	"amount" integer,
	"customer" varchar(100) NOT NULL,
	"manager" varchar(30) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_doc_number_unique" UNIQUE("doc_number")
);
--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_product_date_idx" ON "transactions" USING btree ("product_id","date");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");