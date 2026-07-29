-- PIN para salir del modo Autoservicio (kiosk). Blinda el botón "Salir" del
-- kiosko para que sólo el personal pueda cerrarlo y volver al panel del negocio:
-- un cliente curioso no debe poder tocar "Salir" y caer en el panel del dueño.
--
-- Se guarda a nivel NEGOCIO (no por terminal) para que el dueño pueda cambiarlo o
-- recuperarlo desde cualquier dispositivo. El resto de la config del kiosko
-- (askType, payAtCounter, autoPrint, welcome) sigue siendo preferencia local de
-- cada tablet en localStorage.
--
-- NULL / cadena vacía = sin PIN (la salida vuelve a la confirmación simple). Se
-- guardan sólo dígitos (4 a 6) desde /api/biz/settings.

alter table businesses
  add column if not exists kiosk_exit_pin text;
