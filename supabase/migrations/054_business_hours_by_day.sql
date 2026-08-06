-- Horario por día de la semana. Antes el negocio solo tenía un rango único
-- (`hours` = "HH:MM – HH:MM") aplicado a todos los días. `hours_json` guarda el
-- horario real por día: un arreglo de 7 posiciones indexado por Date.getDay()
-- (0 = domingo … 6 = sábado), donde cada día es {"open":"HH:MM","close":"HH:MM"}
-- o null (cerrado ese día). El string `hours` se mantiene con un rango
-- representativo para compatibilidad con lo que aún lo lee.
alter table businesses add column if not exists hours_json jsonb;
