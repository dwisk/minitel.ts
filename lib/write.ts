import MinitelTS from "./minitel.js";

export default class MinitelTSWrite {

  private minitel: MinitelTS;

  constructor(minitel: MinitelTS) {
    this.minitel = minitel;
  }

  cls() {
    this.minitel.sendChr(12); // Form Feed (FF) - Clears the screen
    this.minitel.input.cursor(false);
  }

  pos(line: number, column = 1) {
    if (line === 1 && column === 1) {
      this.minitel.sendChr(30);
    } else {
      this.minitel.sendChr(31);
      this.minitel.sendChr(64 + line);
      this.minitel.sendChr(64 + column);
    }
  }

  newLine() {
    this.minitel.sendChr(10); // line feed
    this.minitel.sendChr(13); // begining of current line
  }
  startLine() {
    this.minitel.sendChr(13); // begining of current line
  }

  backspace() {
    this.minitel.sendChr(8); // backspace
  }

  backColor(color: number) {
    this.minitel.sendEsc(String.fromCharCode(80 + color));
  }

  foreColor(color: number) {
    this.minitel.sendEsc(String.fromCharCode(64 + color));
  }

  inverse(enable = true) {
    this.minitel.sendEsc(enable ? '\x5D' : '\x5C'); // Inverse on/off
  }

  underline(enable = true) {
    this.minitel.sendEsc(enable ? '\x5A' : '\x59'); // Underline on/off
  }

  flash(enable = true) {
    this.minitel.sendEsc(enable ? '\x48' : '\x49'); // Flashing text on/off
  }

  deleteLine(line: number, column: number | undefined) {
    this.pos(line, column);
    this.minitel.sendChr(24); // CAN (Cancel line)
  }


  print(text: string, color:number|undefined = undefined) {
    const encodedText = Buffer.from(this.convertAccents(text), "latin1"); 
    if (color) { this.foreColor(color)};
    
    // split \n and send each line, handling consecutive \n\n
    const lines = encodedText.toString().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const encodedLine = Buffer.from(this.convertAccents(line), "latin1");
      this.minitel.send(encodedLine);
      // new line only between lines
      if (i !== lines.length - 1) this.newLine();
    }
    
    if (color) { this.foreColor(this.minitel.colors.blanc)};
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

}