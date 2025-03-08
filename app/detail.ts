import { Minitel } from "../lib/minitel.ts";

export default async function screen(minitel:Minitel, state:any) {
    minitel.setState({run: state.run ? state.run + 1 : 1});
    minitel.cls();
    minitel.pos(3, 5);
    minitel.print(`Welcome to Minitel TS! ${state.run || 0}`);


    await minitel.waitForKey();
    minitel.bip();
    minitel.goto('index.ts');
    
}

