-- =============================================
-- StockImport - Schema para Supabase
-- Ejecutar en: Supabase → SQL Editor
-- =============================================

create table public.ledger (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  type text not null,
  currency text not null,
  amount numeric not null,
  exchange_rate numeric,
  balance_pen numeric not null default 0,
  balance_usd numeric not null default 0,
  description text not null,
  product_id uuid
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  variante text,
  serie text,
  notes text,
  purchase_price_usd numeric not null default 0,
  tax_usa_rate numeric not null default 0,
  tax_usa_amount numeric not null default 0,
  freight_cost_usd numeric not null default 0,
  operational_cost_usd numeric not null default 0,
  peru_import_tax_rate numeric not null default 0,
  peru_import_tax_amount numeric not null default 0,
  red_channel_cost_usd numeric not null default 0,
  other_costs_usd numeric not null default 0,
  total_cost_usd numeric not null default 0,
  manual_exchange_rate numeric not null default 3.8,
  total_cost_pen numeric not null default 0,
  purchase_date timestamptz not null,
  arrival_date timestamptz,
  status text not null default 'Comprado'
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  customer_name text not null,
  sale_date timestamptz not null,
  sale_currency text not null,
  total_price numeric not null,
  amount_paid numeric not null,
  pending_amount numeric not null default 0,
  is_fully_paid boolean not null default false,
  delivery_date timestamptz
);

create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  variante text,
  color text,
  purchase_price_usd numeric not null default 0,
  tax_usa_rate numeric not null default 0,
  tax_usa_amount numeric not null default 0,
  freight_cost_usd numeric not null default 0,
  operational_cost_usd numeric not null default 0,
  peru_import_tax_rate numeric not null default 0,
  peru_import_tax_amount numeric not null default 0,
  red_channel_cost_usd numeric not null default 0,
  other_costs_usd numeric not null default 0,
  total_cost_usd numeric not null default 0,
  exchange_rate numeric not null default 3.8,
  total_cost_pen numeric not null default 0,
  expected_sale_price_pen numeric not null default 0,
  expected_profit_pen numeric not null default 0,
  expected_roi numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Habilitar Realtime para actualizaciones en vivo
alter publication supabase_realtime add table public.ledger;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.simulations;
