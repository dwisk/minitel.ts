import { SerialPort } from 'serialport';
import * as fs from 'fs';
import * as path from 'path';

export type Color = {
  noir: number;
  rouge: number;
  vert: number;
  jaune: number;
  bleu: number;
  magenta: number;
  cyan: number;
  blanc: number;
};

export type Route = {
  path: string;
  loop: Function;
  state: any;
};

export class Minitel {
  public colors: Color;
  
  private port: SerialPort | undefined;
  private currentInputLength: number;

  public state: any;
  private routes: Route[];
  private route: Route | null;


  constructor() {
    this.state = {};
    this.currentInputLength = 0;
    this.colors = {
      noir: 0, rouge: 1, vert: 2, jaune: 3,
      bleu: 4, magenta: 5, cyan: 6, blanc: 7
    };
    this.routes = [];
    this.route = null;
  }

  async loadRoutes(routeDir: string) {
      this.routes = [];
      const appDir = path.join(import.meta.dirname, '..', routeDir);
      const files = fs.readdirSync(appDir);
      for (const file of files) {
        if (file.endsWith('.ts')) {
          const p = path.join(appDir, file);
          const a = await import(p);
          this.routes.push({ path: file, loop: a.default, state: {} });
        }
      }
      this.route = this.routes.find(r => r.path === 'index.ts') || null;
      console.log('Routes loaded:', this.routes);
  }

  goto(route: string) {
    this.route = this.routes.find(r => r.path === route) || null;
  }

  init (path: string, baudRate:number = 1200): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.port = new SerialPort({ 
        path, 
        baudRate, 
        dataBits: 7,
        parity: 'even',
        stopBits: 1,
        rtscts: false 
      }, (err) => {
        if (err) {
          console.error('Error opening port:', err.message);
        }
      });
      this.port.on('open', () => {
        resolve();
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

  cls() {
    this.sendChr(12); // Form Feed (FF) - Clears the screen
    this.cursor(false);
  }

  cursor(visible: boolean) {
    this.sendChr(visible ? 17 : 20); // Show (17) or hide (20) blinking cursor
  }

  pos(line: number, column = 1) {
    if (line === 1 && column === 1) {
      this.sendChr(30);
    } else {
      this.sendChr(31);
      this.sendChr(64 + line);
      this.sendChr(64 + column);
    }
  }

  print(text: string) {
    const encodedText = Buffer.from(this.convertAccents(text), "latin1"); 
    this.send(encodedText);
  }

  convertAccents(text: string) {
    return text
      .replace(/à/g, '\x19\x41a')
      .replace(/â/g, '\x19\x43a')
      .replace(/é/g, '\x19\x42e')
      .replace(/è/g, '\x19\x41e')
      .replace(/ê/g, '\x19\x43e')
      .replace(/ç/g, '\x19\x4Bc')
      .replace(/ô/g, '\x19\x43o')
      .replace(/û/g, '\x19\x43u')
      .replace(/ü/g, '\x19\x48u');
  }

  // Clears screen and line 0
  home() {
    this.sendChr(12); // Clear screen
    this.cursor(false); // Hide cursor
  }

  backColor(color: number) {
    this.sendEsc(String.fromCharCode(80 + color));
  }

  foreColor(color: number) {
    this.sendEsc(String.fromCharCode(64 + color));
  }

  inverse(enable = true) {
    this.sendEsc(enable ? '\x5D' : '\x5C'); // Inverse on/off
  }

  underline(enable = true) {
    this.sendEsc(enable ? '\x5A' : '\x59'); // Underline on/off
  }

  flash(enable = true) {
    this.sendEsc(enable ? '\x48' : '\x49'); // Flashing text on/off
  }

  deleteLine(line: number, column: number | undefined) {
    this.pos(line, column);
    this.sendChr(24); // CAN (Cancel line)
  }

  plot(char: any, count: number) {
    for (let i = 0; i < count; i++) {
      this.print(char);
    }
  }

  bip() {
    this.sendChr(7); // Beep sound
  }

  waitForKey() {
    return new Promise((resolve) => {
      if (!this.port) {
        console.error('Port not open');
        return;
      }
      this.port.once('data', (data) => {
        resolve(data.toString());
      });
    });
  }

  startBlinkingCursor() {
    this.sendChr(17); // Show cursor (Con)
  }
  
  stopBlinkingCursor() {
    this.sendChr(20); // Ensure cursor is hidden at the end
  }
  
  input(line: number, column: number, length: number, placeholder = '.') {
    // Position the cursor at the start of the input field
    this.pos(line, column);
    let inputText = "";
    this.currentInputLength = 0; // reset input length
    this.startBlinkingCursor();
  
    let funcBuffer = ""; // Buffer to catch function key sequences (start with \x13)
  
    return new Promise((resolve) => {
      const onData = (data: { toString: (arg0: string) => any; }) => {
        if (this.port === undefined) {
          console.error('Port not open');
          return;
        }
        // Convert using latin1 since Minitel uses ISO-8859-1
        let str = data.toString("latin1");
  
        for (let i = 0; i < str.length; i++) {
          let char = str[i];
  
          if (funcBuffer) {
            // We're in a function key sequence; add the new char
            funcBuffer += char;
            if (funcBuffer.length === 2) {
              if (funcBuffer === '\x13\x41') {
                // ENVOI button: finish input
                this.port.removeListener('data', onData);
                this.stopBlinkingCursor();
                resolve(inputText);
              } else if (funcBuffer === '\x13\x45') {
                // Annulation: clear the input area
                inputText = "";
                this.currentInputLength = 0;
                this.pos(line, column);
                this.print(" ".repeat(length));
                this.pos(line, column);
              } else if (funcBuffer === '\x13\x47') {
                // RETOUR: delete the last character
                if (inputText.length > 0) {
                  inputText = inputText.slice(0, -1);
                  this.currentInputLength = inputText.length;
                  this.pos(line, column + this.currentInputLength);
                  this.print(" "); // blank the last character
                  this.pos(line, column + this.currentInputLength);
                }
              } else {
                // Unrecognized sequence, beep as needed
                this.bip();
              }
              // Reset the function key buffer after processing a two-byte sequence
              funcBuffer = "";
            }
            continue;
          }
  
          if (char === '\x13') {
            // Start a function key sequence
            funcBuffer = char;
          } else if (char === '\r' || char === '\n') {
            // ENTER key finishes input
            this.port.removeListener('data', onData);
            this.stopBlinkingCursor();
            resolve(inputText);
          } else if (char >= ' ' && inputText.length < length) {
            // Append normal characters; update the current input length for cursor positioning
            inputText += char;
            this.currentInputLength = inputText.length;
            // Minitel echoes input automatically, so no manual printing is needed
          } else {
            // For extra characters beyond the limit, beep
            this.bip();
          }
        }
      };
      if (this.port === undefined) {
        console.error('Port not open');
        return;
      }
      this.port.on('data', onData);
    });
  }

  scroll(enable = true) {
    this.sendEsc(enable ? '\x3A\x6A\x43' : '\x3A\x6B\x43'); // Enable/disable scrolling
  }

  setState (newState: any) {
    this.state = { ...this.state, ...newState };
  }

  async loop(routeDir: string = 'app') {
    console.log('Minitel loop started…')
    await this.loadRoutes(routeDir);
    this.cls();
    if (this.route === null) {
      console.error('No route defined!');
      return;
    }
    while(true) {
      await this.route.loop(this, this.state);
    }
  }
}
