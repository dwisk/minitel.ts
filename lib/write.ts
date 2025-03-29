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


  print(text: string) {
    const encodedText = Buffer.from(this.convertAccents(text), "latin1"); 
    this.minitel.send(encodedText);
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