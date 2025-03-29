import MinitelTS from './dist/minitel.js';
import 'dotenv/config'

// Example usage:
const minitel = new MinitelTS();
await minitel.init();
await minitel.loop();
