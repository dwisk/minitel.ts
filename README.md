# minitel.ts
Starting with a port of https://github.com/cquest/pynitel to TypeScript.

- Minimum NodeJS 23 (for direct typescript)
- Some basic routing, inspired by next.js

## Basic usage
This example creates two screens which are saved in two .ts files under `/app`, demonstrates simple routing and state-management.

NPM install
```bash
npm install minitel.ts
```

Create a `.env` file, and set path & baudrate
```bash
MINITEL_PATH=/dev/tty.usbserial-0001 # MacOS
MINITEL_BAUDRATE=1200
MINITEL_SILENT=false # disable beeps
```

Create a `app.ts` file
```typescript

import MinitelTS from 'minitel.ts'; 

// Example usage:
const minitel = new MinitelTS();
await minitel.init();
await minitel.loop('./app');
```

Create a `app/index.ts` file
```typescript
import MinitelTS from 'minitel.ts'; 
import type { MinitelTSRoute } from "minitel.ts/types";

export const initialState =  {userInput: '...'};

export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
  // shortcut
  const { input, output } = minitel;

  // global and local store/state
  const { store, setStore } = minitel.store;
  const { state, setState} = route.state;

  // clear screen
  output.cls();

  // set position and welcome
  output.pos(3, 5);
  output.print(`Welcome to Minitel TS! ${store.loop || 0}`);

  // if store, show to user
  if (store.userInput) {
      output.pos(7, 5);
      output.foreColor(minitel.colors.vert);
      output.print(`Minitel store.userInput: ${store.userInput}`);    
  }
  // if state, show to user
  if (state.userInput) {
      output.pos(9, 5);
      output.foreColor(minitel.colors.vert);
      output.print(`Route state.userInput: ${state.userInput}`);    
  }

  // set position and wait for input
  output.pos(5, 5);
  output.foreColor(minitel.colors.bleu);
  output.print("Type something:");
  let userInput = await input.line(6, 5, 10);

  // set input into store & state
  setStore({ userInput });
  setState({ userInput });

  // beep
  minitel.bip();

  // if DETAIL is entered, route to `detail.ts`
  if (userInput === 'DETAIL') {
      minitel.router.goto('detail');
  }
}
```

Create a `app/detail.ts` file
```typescript
import MinitelTS from 'minitel.ts'; 

export default async function screen(minitel:MinitelTS) {
  // shortcut
  const { output } = minitel;

  // get store
  const { store, setStore } = minitel.store;

  // show welcome
  output.cls();
  output.pos(3, 5);
  output.print(`Welcome to Minitel TS! ${store.loop || 0}`);

  // wait for key (any input)
  await minitel.input.waitForKey();

  // reset userInput in store
  setStore({userInput: ''});

  // beep
  minitel.bip();

  // go back to index
  minitel.router.goto('index');
}
```


Run it! *(remember NodeJS > 23 for direct typescript)*
```bash
node app.ts
```