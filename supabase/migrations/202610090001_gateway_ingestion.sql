-- Apply to a development Supabase project first. No public read/write policies.
create table public.telemetry_packets (
  device_id text not null,
  packet_id uuid not null,
  recorded_at timestamptz not null default now(),
  node_uptime_ms bigint not null check (node_uptime_ms between 0 and 4294967295),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  primary key (device_id, packet_id),
  check (payload->>'id' = device_id)
);
create index telemetry_packets_device_time_idx
  on public.telemetry_packets (device_id, recorded_at desc);
alter table public.telemetry_packets enable row level security;
revoke all on public.telemetry_packets from anon, authenticated;
grant select, insert on public.telemetry_packets to service_role;

-- false = newly inserted; true = identical retry. A changed retry is a conflict.
create function public.ingest_telemetry(p_packet_id uuid, p_packet jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  inserted_count integer;
  existing_packet jsonb;
begin
  insert into public.telemetry_packets (device_id, packet_id, node_uptime_ms, payload)
  values (p_packet->>'id', p_packet_id, (p_packet->>'ts')::bigint, p_packet)
  on conflict (device_id, packet_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then return false; end if;
  select payload into existing_packet from public.telemetry_packets
    where device_id = p_packet->>'id' and packet_id = p_packet_id;
  if existing_packet is distinct from p_packet then
    raise exception 'Packet ID reused with different data' using errcode = '23505';
  end if;
  return true;
end;
$$;
revoke all on function public.ingest_telemetry(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.ingest_telemetry(uuid, jsonb) to service_role;
