import MinitelTS from './lib/minitel.ts';
import 'dotenv/config'

// Example usage:
const minitel = new MinitelTS();
await minitel.init();
await minitel.loop();
