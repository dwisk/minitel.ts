import MinitelTS from './lib/minitel.ts';

// Example usage:
const minitel = new MinitelTS();
await minitel.init('/dev/tty.usbserial-0001');
await minitel.loop();
