-- Segnalazioni: domande a cui il bot non ha trovato risposta nel regolamento, salvate SOLO quando il
-- visitatore tocca "Sì, segnala". Si leggono dalla dashboard (Table editor → bot_segnalazioni).
-- Testo della domanda (max 300 caratteri) e data; l'IP solo come hash, per il limite anti-abuso.
create table if not exists public.bot_segnalazioni (
  id bigint generated always as identity primary key,
  domanda text not null check (char_length(domanda) between 1 and 300),
  ip_hash text not null,
  creata timestamptz not null default now()
);

create index if not exists bot_segnalazioni_ip on public.bot_segnalazioni (ip_hash, creata);

-- RLS attiva e nessuna policy: dalle API pubbliche non si legge e non si scrive.
alter table public.bot_segnalazioni enable row level security;
revoke all on table public.bot_segnalazioni from public, anon, authenticated;

-- Salva una segnalazione: al massimo 5 all'ora per visitatore.
create or replace function public.bot_segnala(p_ip text, p_domanda text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from bot_segnalazioni where ip_hash = p_ip and creata > now() - interval '1 hour') >= 5 then
    return 'troppe-domande';
  end if;
  insert into bot_segnalazioni (domanda, ip_hash) values (left(trim(p_domanda), 300), p_ip);
  return 'ok';
end;
$$;

revoke execute on function public.bot_segnala(text, text) from public, anon, authenticated;
grant execute on function public.bot_segnala(text, text) to service_role;
