import MinitelTS from "./minitel.js";
import MinitelTSWrite from "./write.js";

export default class MinitelTSRead {

  private minitel: MinitelTS;
  private output: MinitelTSWrite;
  private currentInputLength: number;

  constructor(minitel: MinitelTS) {
    this.minitel = minitel;
    this.output = minitel.output;
    this.currentInputLength = 0;
  }

  line(line: number, column: number, length: number) {
    // Position the cursor at the start of the input field
    this.minitel.output.pos(line, column);
    let inputText = "";
    this.currentInputLength = 0; // reset input length
    this.cursor(true);
  
    let funcBuffer = ""; // Buffer to catch function key sequences (start with \x13)
  
    return new Promise((resolve) => {
      const onData = (data: { toString: (arg0: string) => any; }) => {
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
                this.minitel.removeListener('data', onData);
                this.cursor(false);
                resolve(inputText);
              } else if (funcBuffer === '\x13\x45') {
                // Annulation: clear the input area
                inputText = "";
                this.currentInputLength = 0;
                this.output.pos(line, column);
                this.output.print(" ".repeat(length));
                this.output.pos(line, column);
              } else if (funcBuffer === '\x13\x47') {
                // RETOUR: delete the last character
                if (inputText.length > 0) {
                  inputText = inputText.slice(0, -1);
                  this.currentInputLength = inputText.length;
                  this.output.pos(line, column + this.currentInputLength);
                  this.output.print(" "); // blank the last character
                  this.output.pos(line, column + this.currentInputLength);
                }
              } else {
                // Unrecognized sequence, beep as needed
                this.minitel.bip();
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
            this.minitel.removeListener('data', onData);
            this.cursor(false);
            resolve(inputText);
          } else if (char >= ' ' && inputText.length < length) {
            // Append normal characters; update the current input length for cursor positioning
            inputText += char;
            this.currentInputLength = inputText.length;
            // Minitel echoes input automatically, so no manual printing is needed
          } else {
            // For extra characters beyond the limit, beep
            this.minitel.bip();
          }
        }
      };
      this.minitel.on('data', onData);
    });
  }

  private label(label:string) {
    const output = this.minitel.output;
    output.inverse(true)
    output.print(label);
    output.inverse(false)
    output.print(": ");
  }

  here(label = 'Input'): Promise<string> {
    // Position the cursor at the start of the input field
    let inputText = "";
    this.currentInputLength = 0; // reset input length
    const output = this.minitel.output;
    
    this.label(label);
    
    this.cursor(true);

  
    let funcBuffer = ""; // Buffer to catch function key sequences (start with \x13)
  
    return new Promise((resolve, reject) => {
      const onData = (data: { toString: (arg0: string) => any; }) => {
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
                this.minitel.removeListener('data', onData);
                this.cursor(false);
                resolve(inputText);

                // SOMMAIRE
              } else if (funcBuffer === '\x13F') {
                // reject('<KEY:SOMMAIRE>');
                reject(new Error('KEY:SOMMAIRE'));

              } else if (funcBuffer === '\x13\x45') {
                // Annulation: clear the input area
                for (let i = 0; i < this.currentInputLength; i++) {
                  output.backspace();
                  output.print(" "); // blank the last character
                  output.backspace();
                }

                inputText = "";
                this.currentInputLength = 0;
              } else if (funcBuffer === '\x13\x47') {
                // RETOUR: delete the last character
                if (inputText.length > 0) {
                  inputText = inputText.slice(0, -1);
                  this.currentInputLength = inputText.length;
                  output.backspace();
                  output.print(" "); // blank the last character
                  output.backspace();
                }
              } else {
                // Unrecognized sequence, beep as needed
                console.log("funcBuffer", JSON.stringify(funcBuffer))
                this.minitel.bip();
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
            this.minitel.removeListener('data', onData);
            this.cursor(false);
            resolve(inputText);
          } else if (char >= ' ' ) { // && inputText.length < length
            // Append normal characters; update the current input length for cursor positioning
            inputText += char;
            this.currentInputLength = inputText.length;
            // Minitel echoes input automatically, so no manual printing is needed
          } else {
            // For extra characters beyond the limit, beep
            this.minitel.bip();
          }
        }
      };
      this.minitel.on('data', onData);
    });
  }


  waitForKey() {
    return new Promise((resolve) => {
      this.minitel.once('data', (data) => {
        resolve(data.toString());
      });
    });
  }

  cursor(visible: boolean) {
    this.minitel.sendChr(visible ? 17 : 20); // Show (17) or hide (20) blinking cursor
  }

}