create extension if not exists pgcrypto;
create table if not exists merchants (id uuid primary key default gen_random_uuid(),name text not null,email text not null unique,status text not null default 'active' check(status in ('active','suspended')),created_at timestamptz not null default now());
create table if not exists api_keys (id uuid primary key default gen_random_uuid(),merchant_id uuid not null references merchants(id) on delete cascade,key_prefix text not null,key_hash text not null unique,mode text not null default 'test' check(mode in ('test','live')),revoked_at timestamptz,created_at timestamptz not null default now());
create table if not exists transactions (id uuid primary key default gen_random_uuid(),merchant_id uuid not null references merchants(id) on delete restrict,reference text not null unique,amount numeric(20,2) not null check(amount>0),currency char(3) not null default 'NGN',customer_email text not null,status text not null default 'pending' check(status in ('pending','paid','failed','refunded')),mode text not null default 'test' check(mode in ('test','live')),metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now(),paid_at timestamptz);
create index if not exists transactions_merchant_idx on transactions(merchant_id);
create index if not exists transactions_reference_idx on transactions(reference);
alter table merchants enable row level security;
alter table api_keys enable row level security;
alter table transactions enable row level security;