// Le decisioni ufficiali (house-rules.js) e lo stato dei casi (ambiguities.json) devono coincidere.
import { describe, it, expect } from 'vitest';
import ambig from '../../src/kb/ambiguities.json' with { type: 'json' };
import { DECISIONI, resolveAmbiguity } from '../../src/kb/house-rules.js';
import { answerById } from '../../src/chat/router.js';

const casi = ambig.ambiguities;

describe('decisioni di Factanza', () => {
  it('ogni decisione corrisponde a un caso confermato, e viceversa', () => {
    const ids = new Set(casi.map((a) => a.id));
    for (const id of Object.keys(DECISIONI)) expect(ids.has(id), `decisione senza caso: ${id}`).toBe(true);
    for (const a of casi.filter((x) => x.stato === 'confermata')) expect(DECISIONI[a.id], `caso confermato senza decisione: ${a.id}`).toBeTruthy();
    for (const a of casi.filter((x) => x.stato !== 'confermata')) expect(resolveAmbiguity(a)).toBeNull();
  });

  it('un caso confermato si mostra come decisione ufficiale, uno aperto come interpretazione', () => {
    const confermato = answerById('promessa-effetto-carta').text;
    expect(confermato).toContain('Decisione ufficiale di Factanza');
    expect(confermato).not.toContain('interpretazione, non regola ufficiale');
    const aperto = answerById('senso-sinistra').text;
    expect(aperto).toContain('interpretazione, non regola ufficiale');
  });
});
