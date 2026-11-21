import fs from 'node:fs';
import path from 'node:path';
import type { Career, LearningResource } from '../shared/types.ts';

let cachedCareers: Career[] | null = null;
let cachedResources: LearningResource[] | null = null;

function resolveDataFile(filename: string): string {
  return path.resolve(process.cwd(), 'data', filename);
}

export function loadCareers(): Career[] {
  if (!cachedCareers) {
    const raw = fs.readFileSync(resolveDataFile('careers.json'), 'utf8');
    cachedCareers = JSON.parse(raw) as Career[];
  }
  return cachedCareers;
}

export function loadResources(): LearningResource[] {
  if (!cachedResources) {
    const raw = fs.readFileSync(resolveDataFile('resources.json'), 'utf8');
    cachedResources = JSON.parse(raw) as LearningResource[];
  }
  return cachedResources;
}

export function getCareerMap(): Map<string, Career> {
  return new Map(loadCareers().map((c) => [c.id, c]));
}

export function getResourceMap(): Map<string, LearningResource> {
  return new Map(loadResources().map((r) => [r.id, r]));
}
