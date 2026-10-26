// Integrità dei dati trascritti dalle carte.
import { describe, it, expect } from 'vitest';
import { db } from '../../src/data.js';

const EFFECTS = [null, 'risoluzione', 'soldi', 'colpo', 'doppio_colpo', 'tensione', 'nuova_linea', 'cambio_priorita', 'allocazione'];

describe('dati delle carte', () => {
  it('ha il numero giusto di carte (pag. 5: 39 Progetti, 23 Eventi, 25+1 Pensatori)', () => {
    expect(db.projectList).toHaveLength(39);
    expect(db.eventList).toHaveLength(23);
    expect(db.thinkerList).toHaveLength(26);
  });

  it.each(db.projectList.map((p) => [p.nome, p]))('Progetto %s è completo', (_, p) => {
    expect(Number.isInteger(p.costo) && p.costo > 0).toBe(true);
    expect(['difesa', 'economia', 'tecnologia']).toContain(p.risorsa.tipo);
    expect(p.risorsa.valore).toBeGreaterThanOrEqual(1);
    expect(p.risorsa.valore).toBeLessThanOrEqual(4);
    expect(['pubblico', 'privato']).toContain(p.ideologie.asse_pp);
    expect(['preservazione', 'consumo']).toContain(p.ideologie.asse_pc);
    expect(['innovazione', 'tradizione']).toContain(p.ideologie.asse_it);
    expect(EFFECTS).toContain(p.effetto);
  });

  it.each(db.eventList.map((e) => [e.nome, e]))('Evento %s è completo', (_, e) => {
    const r = e.requisiti;
    const res = r.difesa + r.economia + r.tecnologia;
    expect((res > 0) !== (r.carte > 0)).toBe(true);
    expect(EFFECTS).toContain(e.effetto);
    expect(typeof e.twist).toBe('string');
    expect(e.colpo_di_scena.length).toBeGreaterThan(10);
  });

  it('i nomi sono unici', () => {
    const all = [...db.projectList, ...db.eventList, ...db.thinkerList].map((c) => c.nome.toLowerCase());
    expect(new Set(all).size).toBe(all.length);
  });

  it('tabellone: 2 Fondanti, 5 Principali, 5 Provvisori, Tensione con 8 caselle dopo la partenza', () => {
    expect(db.board.fondanti.spazi).toBe(2);
    expect(db.board.principali.spazi).toBe(5);
    expect(db.board.provvisori.map((s) => s.effetto)).toEqual(['soldi', 'promessa', null, 'risoluzione', 'allocazione']);
    expect(db.board.tensione).toHaveLength(9);
    expect(db.board.tensione.at(-1).effetto).toBe('sconfitta');
  });

  it('esempio di pag. 8: Banca di microcredito = 3 economia, costo 7, colpo di scena', () => {
    const p = db.projectList.find((x) => x.nome.toLowerCase().includes('microcredito'));
    expect(p).toMatchObject({ costo: 7, risorsa: { tipo: 'economia', valore: 3 }, effetto: 'colpo' });
  });
});
