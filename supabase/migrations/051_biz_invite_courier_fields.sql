-- Consolidación de repartidores: el registro de repartidores deja de vivir en la
-- sección "Entrega a domicilio" (tabla couriers directa) y pasa a Empleados
-- (rol 'repartidor', vía biz_invites → biz_members). Para poder crear la fila en
-- `couriers` cuando el repartidor ACEPTA su invitación, guardamos su nombre y
-- teléfono en la invitación pendiente.
alter table biz_invites add column if not exists courier_name  text;
alter table biz_invites add column if not exists courier_phone text;

-- Backfill: los repartidores que ya son miembros (invitados por Empleados antes
-- de este cambio) no tienen fila en `couriers`, así que no aparecían en la
-- asignación de pedidos ni en /courier. Se las creamos (sin nombre/teléfono; el
-- dueño puede reinvitarlos para capturarlos). No pisa couriers existentes.
insert into couriers (user_id, biz_id, active)
select m.user_id, m.biz_id, true
from biz_members m
where m.role = 'repartidor'
on conflict (user_id) do nothing;
