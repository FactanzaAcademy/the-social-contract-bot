// Registro anonimo delle domande.
import { describe, it, expect, vi } from 'vitest';
import { sanitize, configure, log, enabled } from '../../src/log/logger.js';

describe('registro', () => {
  it('maschera email e numeri di telefono', () => {
    expect(sanitize('scrivimi a mario.rossi@gmail.com o al +39 333 123 4567')).toBe('scrivimi a [email] o al [numero]');
    expect(sanitize('offriamo 3 4 e 2, costo 8')).toBe('offriamo 3 4 e 2, costo 8');
    expect(sanitize('x'.repeat(400))).toHaveLength(300);
  });

  it('senza configurazione non invia niente', () => {
    const fetchImpl = vi.fn();
    expect(configure(null, { fetchImpl })).toBe('nessuno');
    log('domanda', { domanda: 'ciao' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(enabled()).toBe(false);
  });

  it('apps-script: POST testo semplice con l\'evento anonimo', () => {
    const fetchImpl = vi.fn(() => Promise.resolve());
    configure({ tipo: 'apps-script', url: 'https://script.google.com/macros/s/x/exec' }, { fetchImpl });
    const ev = log('nessuna', { domanda: 'mail a a@b.it', proposte: ['turno'] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchImpl.mock.calls[0];
    expect(url).toContain('/exec');
    expect(opts).toMatchObject({ method: 'POST', mode: 'no-cors' });
    const body = JSON.parse(opts.body);
    expect(body).toMatchObject({ tipo: 'nessuna', domanda: 'mail a [email]', proposte: ['turno'] });
    expect(body.sessione).toBe(ev.sessione);
    expect(Object.keys(body)).not.toContain('ip');
  });

  it('wix: postMessage alla pagina che contiene il bot', () => {
    const parent = { postMessage: vi.fn() };
    configure({ tipo: 'wix' }, { parent });
    log('utile', { domanda: 'q', scelta: 'turno', utile: false });
    expect(parent.postMessage).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'tsc-registro', evento: expect.objectContaining({ tipo: 'utile', utile: false }) }), '*');
  });
});
