-- Remove only the extra synthetic nodes; real gateway telemetry is untouched.
delete from public.dashboard_demo_packets
where dataset_id = 'wqm-dashboard-demo-v1' and device_id in ('DEMO-002', 'DEMO-003');
alter table public.dashboard_demo_packets drop constraint dashboard_demo_packets_device_id_check;
alter table public.dashboard_demo_packets add constraint dashboard_demo_packets_device_id_check
check (device_id = 'DEMO-001');
