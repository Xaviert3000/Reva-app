-- Fase 7 — Campos que faltaban para Rove real.
-- rove_rewards necesita datos de presentación del negocio + stock/vigencia que la
-- UI ya usa; profiles necesita un código de referido único para el lookup.

alter table rove_rewards add column if not exists biz_name   text;
alter table rove_rewards add column if not exists biz_letter text;
alter table rove_rewards add column if not exists biz_color  text;
alter table rove_rewards add column if not exists stock      integer;      -- null = ilimitado
alter table rove_rewards add column if not exists valid_days integer default 30;

-- Código de referido por usuario (para compartir e invitar). Se llena la primera
-- vez que el usuario abre Reva+ (getReferralStats) y sirve de lookup al aplicarlo.
alter table profiles add column if not exists referral_code text unique;
