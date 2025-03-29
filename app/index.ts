import MinitelTS from "../dist/minitel.js";
import type { MinitelTSRoute } from "../dist/types";

export const initialState =  {userInput: '...'};

export default async function screen(minitel:MinitelTS, route:MinitelTSRoute) {
    const { input, output } = minitel;
    const { store, setStore } = minitel.store;
    const { state, setState} = route.state;
    output.cls();
    output.pos(3, 5);
    output.print(`Welcome to Minitel TS! ${store.loop || 0}`);

    if (store.userInput) {
        output.pos(7, 5);
        output.foreColor(minitel.colors.vert);
        output.print(`Minitel store.userInput: ${store.userInput}`);    
    }
    if (state.userInput) {
        output.pos(9, 5);
        output.foreColor(minitel.colors.vert);
        output.print(`Route state.userInput: ${state.userInput}`);    
    }

    output.pos(5, 5);
    output.foreColor(minitel.colors.bleu);
    output.print("Type something:");
    let userInput = await input.line(6, 5, 10);
    setStore({ userInput });
    setState({ userInput });

    minitel.bip();
    if (userInput === 'DETAIL') {
       minitel.router.goto('detail');
    }
    
}

