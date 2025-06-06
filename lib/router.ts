import * as fs from 'fs';
import * as path from 'path';

import type { MinitelTSRoute } from './types.d.ts';
import MinitelTSState from './state.js';

export default class MinitelTSRouter {
  public routes: MinitelTSRoute[];
  public current: MinitelTSRoute | null;

  constructor() {
    this.routes = [];
    this.current = null;
  }

  async loadRoutes(routeDir: string, initialRoute: string = 'index') {
    this.routes = [];
    const appDir = path.join(path.dirname(process.argv[1]), routeDir);
    console.log(appDir)
    const files = fs.readdirSync(appDir);
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const p = path.join(appDir, file);
        const a = await import(p);
        this.routes.push({
          path: file.replace('.ts', '').replace('.js', ''),
          name: a.name || file.replace('.ts', '').replace('.js', ''),
          loop: a.default,
          state: MinitelTSState({initial:a.initialState})
        });
      }

      // if file is directory, check for directory/index.ts and add it to routes
      if (fs.statSync(path.join(appDir, file)).isDirectory()) {
        const indexFileJS = path.join(appDir, file, 'index.js');
        const indexFileTS = path.join(appDir, file, 'index.ts');
        let indexFile = '';
        if (fs.existsSync(indexFileJS)) {
          indexFile = indexFileJS;
        } else if (fs.existsSync(indexFileTS)) {
          indexFile = indexFileTS;
        } 
        if (fs.existsSync(indexFile)) {
          const a = await import(indexFile);
          this.routes.push({
            path: file,
            name: a.name || file,
            loop: a.default,
            state: MinitelTSState({ initial: a.initialState })
          });
        }
      }

    }
    this.current = this.routes.find(r => r.path === initialRoute) || null;
    console.log('Routes loaded:', this.routes);
  }

  goto(route: string) {
    this.current = this.routes.find(r => r.path === route || r.name === route) || null;
  }
}