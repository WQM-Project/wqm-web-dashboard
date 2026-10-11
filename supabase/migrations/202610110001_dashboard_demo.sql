-- Synthetic dashboard data is isolated from gateway ingestion.
create table public.dashboard_demo_packets (
  packet_id uuid primary key,
  dataset_id text not null check (dataset_id = 'wqm-dashboard-demo-v1'),
  device_id text not null check (device_id in ('DEMO-001','DEMO-002','DEMO-003')),
  recorded_at timestamptz not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  check (payload->>'id' = device_id)
);
create index dashboard_demo_packets_time_idx on public.dashboard_demo_packets(recorded_at desc);
alter table public.dashboard_demo_packets enable row level security;
revoke all on public.dashboard_demo_packets from public, anon, authenticated;
grant select on public.dashboard_demo_packets to service_role;
