import * as fs from 'fs';
import * as path from 'path';

import type { MinitelTSRoute } from './types.d.ts';
import MinitelTSState from './state.js';

export default class MinitelTSRouter {
  private routes: MinitelTSRoute[];
  public current: MinitelTSRoute | null;

  constructor() {
    this.routes = [];
    this.current = null;
  }

  async loadRoutes(routeDir: string) {
    this.routes = [];
    const appDir = path.join(path.dirname(process.argv[1]), routeDir);
    console.log(appDir)
    const files = fs.readdirSync(appDir);
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const p = path.join(appDir, file);
        const a = await import(p);
        this.routes.push({ path: file, loop: a.default, state: MinitelTSState({initial:a.initialState}) });
      }
    }
    this.current = this.routes.find(r => r.path === 'index.ts') || null;
    console.log('Routes loaded:', this.routes);
  }

  goto(route: string) {
    this.current = this.routes.find(r => r.path === route) || null;
  }
}