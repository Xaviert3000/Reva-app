-- Per-service availability: which weekdays the service is offered and its own
-- hours window, overriding the business hours. Both were already part of the
-- /biz catalog form and the customer-side booking logic (Service.days / .hours,
-- dayOffered / slotsFromHours), but never had columns — so the values were
-- computed, kept in local React state, and lost on save/reload. That made the
-- client (web + native) fall back to the business hours (e.g. 08:30) instead of
-- the service hours the owner set (e.g. 10:30). These columns close that gap.
--
--   days  : weekdays offered, 0=Sun … 6=Sat. NULL / empty = every day.
--   hours : "HH:MM – HH:MM" window for this service. NULL = use business hours.

alter table services add column if not exists days  integer[];
alter table services add column if not exists hours text;
