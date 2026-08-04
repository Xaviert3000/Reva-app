-- PIN de autorización para anular o reembolsar una venta en el módulo Ventas.
-- Blinda las acciones sensibles del historial de tickets: sin este PIN, cualquier
-- persona con acceso al panel (p. ej. un cajero) podría anular/reembolsar ventas
-- y sacarlas de Informes. Con el PIN puesto, Reva lo exige y lo valida en el
-- servidor antes de cambiar el estatus.
--
-- Se guarda a nivel NEGOCIO (no por dispositivo) para que el dueño lo cambie o
-- recupere desde cualquier terminal. Sólo dígitos (4 a 6) desde /api/biz/settings.
--
-- NULL / cadena vacía = sin autorización (anular/reembolsar vuelve a la
-- confirmación simple). Los negocios existentes arrancan en NULL, así que la
-- función sigue igual hasta que el dueño configure un PIN.

alter table businesses
  add column if not exists void_auth_pin text;
