import { Minitel } from "../lib/minitel.ts";

export default async function screen(minitel:Minitel, state:any) {
    minitel.setState({run: state.run ? state.run + 1 : 1});
    minitel.cls();
    minitel.pos(3, 5);
    minitel.print(`Welcome to Minitel TS! ${state.run || 0}`);


    if (state.userInput) {
        minitel.pos(7, 5);
        minitel.foreColor(minitel.colors.vert);
        minitel.print(`You typed: ${state.userInput}`);    
    }

    minitel.pos(5, 5);
    minitel.foreColor(minitel.colors.bleu);
    minitel.print("Type something:");
    let userInput = await minitel.input(6, 5, 10);
    minitel.setState({ userInput });

    minitel.bip();
    if (userInput === 'detail') {
       minitel.goto('detail.ts');
    }
    
}

