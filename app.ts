import { Minitel } from './lib/minitel.ts';

// Example usage:
const minitel = new Minitel();
await minitel.init('/dev/tty.usbserial-0001');
await minitel.loop();
