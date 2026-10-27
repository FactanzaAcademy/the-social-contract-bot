-- Le segnalazioni si conservano 12 mesi, come dice l'informativa privacy del bot (src/kb/privacy.js).
-- Due livelli: ogni nuova segnalazione cancella quelle scadute, e un lavoro pg_cron le cancella ogni notte
-- anche nei periodi in cui non arrivano segnalazioni.

create index if not exists bot_segnalazioni_creata on public.bot_segnalazioni (creata);

create or replace function public.bot_segnala(p_ip text, p_domanda text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from bot_segnalazioni where creata < now() - interval '12 months';
  if (select count(*) from bot_segnalazioni where ip_hash = p_ip and creata > now() - interval '1 hour') >= 5 then
    return 'troppe-domande';
  end if;
  insert into bot_segnalazioni (domanda, ip_hash) values (left(trim(p_domanda), 300), p_ip);
  return 'ok';
end;
$$;

revoke execute on function public.bot_segnala(text, text) from public, anon, authenticated;
grant execute on function public.bot_segnala(text, text) to service_role;

-- pulizia notturna (alle 3:17 UTC); con lo stesso nome il lavoro viene sostituito, non duplicato
create extension if not exists pg_cron;
select cron.schedule(
  'bot-segnalazioni-12-mesi',
  '17 3 * * *',
  $$delete from public.bot_segnalazioni where creata < now() - interval '12 months'$$
);

-- e subito, per quelle già scadute
delete from public.bot_segnalazioni where creata < now() - interval '12 months';
