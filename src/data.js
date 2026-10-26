// Carica i dati delle carte (importati staticamente: esbuild li incorpora nel bundle).
import projects from '../data/projects.json' with { type: 'json' };
import events from '../data/events.json' with { type: 'json' };
import thinkers from '../data/thinkers.json' with { type: 'json' };
import board from '../data/board.json' with { type: 'json' };
import { makeDb } from './engine/state.js';

export const db = makeDb({
  projects: projects.projects,
  events: events.events,
  thinkers: thinkers.thinkers,
  board,
});

export function byName(kind, name) {
  const list = kind === 'project' ? db.projectList : kind === 'event' ? db.eventList : db.thinkerList;
  const n = name.toLowerCase();
  const hit = list.find((c) => c.nome.toLowerCase() === n) || list.find((c) => c.nome.toLowerCase().includes(n));
  if (!hit) throw new Error(`Carta non trovata: ${name}`);
  return hit;
}
