-- Contatori del ponte tra il bot e Claude Haiku (supabase/functions/proponi).
-- Righe: 'spesa:YYYY-MM' (milionesimi di dollaro), 'ip:<hash>:<ora>' e 'ora:<ora>' (domande).
-- Nessun testo delle domande e nessun IP in chiaro: l'IP arriva già trasformato in hash.
create table if not exists public.bot_contatori (
  chiave text primary key,
  valore bigint not null default 0,
  scade timestamptz not null
);

create index if not exists bot_contatori_scade on public.bot_contatori (scade);

-- RLS attiva e nessuna policy: dalle API pubbliche la tabella non si legge e non si scrive.
alter table public.bot_contatori enable row level security;
revoke all on table public.bot_contatori from public, anon, authenticated;

-- Prenota una domanda: controlla prima la spesa del mese, poi il visitatore, poi il totale dell'ora.
-- Gli incrementi sono upsert atomici, quindi due domande simultanee non leggono lo stesso valore.
create or replace function public.bot_prenota(
  p_mese text,
  p_ora text,
  p_ip text,
  p_limite_micro bigint,
  p_limite_orario integer,
  p_limite_totale integer
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  delete from bot_contatori where scade < now();

  select valore into v from bot_contatori where chiave = 'spesa:' || p_mese;
  if coalesce(v, 0) >= p_limite_micro then
    return 'limite-spesa';
  end if;

  insert into bot_contatori as c (chiave, valore, scade)
  values ('ip:' || p_ip || ':' || p_ora, 1, now() + interval '2 hours')
  on conflict (chiave) do update set valore = c.valore + 1
  returning valore into v;
  if v > p_limite_orario then
    return 'troppe-domande';
  end if;

  insert into bot_contatori as c (chiave, valore, scade)
  values ('ora:' || p_ora, 1, now() + interval '2 hours')
  on conflict (chiave) do update set valore = c.valore + 1
  returning valore into v;
  if v > p_limite_totale then
    return 'troppe-domande';
  end if;

  return 'ok';
end;
$$;

-- Aggiunge la spesa reale di una domanda (calcolata dai token usati).
create or replace function public.bot_addebita(p_mese text, p_micro bigint)
returns void
language sql
security definer
set search_path = public
as $$
  insert into bot_contatori as c (chiave, valore, scade)
  values ('spesa:' || p_mese, greatest(p_micro, 0), now() + interval '40 days')
  on conflict (chiave) do update set valore = c.valore + greatest(p_micro, 0);
$$;

-- Solo la funzione (chiave service_role) può chiamarle: la chiave anon, che è pubblica, no.
revoke execute on function public.bot_prenota(text, text, text, bigint, integer, integer) from public, anon, authenticated;
revoke execute on function public.bot_addebita(text, bigint) from public, anon, authenticated;
grant execute on function public.bot_prenota(text, text, text, bigint, integer, integer) to service_role;
grant execute on function public.bot_addebita(text, bigint) to service_role;
