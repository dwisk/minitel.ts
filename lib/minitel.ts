import { SerialPort } from 'serialport';
import EventEmitter from 'events';
import 'colors';

import type { MinitelTSColor } from './types.d.ts';
import MinitelTSRouter from './router.js';
import MinitelTSRead from './read.js';
import MinitelTSWrite from './write.js';
import MinitelTSState from './state.js';

export default class MinitelTS extends EventEmitter {
  public colors: MinitelTSColor;
  
  private port: SerialPort | undefined
  
  public router = new MinitelTSRouter();
  public input = new MinitelTSRead(this);
  public output = new MinitelTSWrite(this);
  public store;

  constructor() {
    super();
    this.colors = {
      noir: 0, rouge: 1, vert: 2, jaune: 3,
      bleu: 4, magenta: 5, cyan: 6, blanc: 7
    };
    this.store = MinitelTSState({name:'store'});
  }

  init (path: string | undefined = undefined, baudRate:number | undefined = undefined): Promise<void> {
    if (!path && !process.env.MINITEL_PATH) {
      console.error('No path defined!');
      process.exit(1);
    }

    const baud = baudRate || parseInt(process.env.MINITEL_BAUDRATE || '1200');
    return new Promise(async (resolve, reject) => {
      await this.openConnection(path, 1200);
      console.log('Connected to Minitel at 1200 baud rate'.green);
      if (baud === 4800) {
        console.log('Switching to 4800 baud rate...'.gray);
        this.sendEsc("\x1b\x3a\x6b\x76");
        this.port?.close();
        await this.openConnection(path, baud);
        console.log('Connected to Minitel at 4800 baud rate'.green);
        resolve();
      } else {
        resolve();
      }
    });
  }

  private openConnection(path: string | undefined, baudRate: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.port = new SerialPort({ 
        path: path || process.env.MINITEL_PATH || '', 
        baudRate,
        dataBits: 7,
        parity: 'even',
        stopBits: 1,
        rtscts: false 
      }, (err) => {
        if (err) {
          console.error('Error opening port:', err.message);
          reject(err);
        }
      });
      this.port.on('open', () => {
        resolve();
      });
      this.port.on('data', (data) => {
        this.emit('data', data);
      });
    });
  }

  send(data: string | Buffer<ArrayBuffer>) {
    if (!this.port) {
      console.error('Port not open');
      return;
    }
    this.port.write(data, (err) => {
      if (err) console.error('Error writing to port:', err.message);
    });
  }

  sendChr(ascii:number) {
    this.send(String.fromCharCode(ascii));
  }

  sendEsc(data: string) {
    this.sendChr(27); // ESC character
    this.send(data);
  }
  
  bip() {
    if (process.env.MINITEL_SILENT !== 'true') {
      this.sendChr(7); // Beep sound
    }
  }

  scroll(enable = true) {
    this.sendEsc(enable ? '\x3A\x6A\x43' : '\x3A\x6B\x43'); // Enable/disable scrolling
  }

  async loop(routeDir: string = 'app', initialRoute: string = 'index', initialStore: object = {}) {
    console.log('Minitel loop started…')

    await this.router.loadRoutes(routeDir, initialRoute);
    if (this.router.current === null) {
      console.error(`No route found at ${routeDir}!`);
      return;
    }
    
    this.output.cls();
    
    while(true) {
      const { store, setStore } = this.store;
      setStore({...initialStore, loop: store.loop ? store.loop + 1 : 1});
      await this.router.current.loop(this, this.router.current);
    }
  }
}
