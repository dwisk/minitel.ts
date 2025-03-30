import MinitelTS from "../../dist/minitel.js";

export default async function screen(minitel:MinitelTS) {
    const { output } = minitel;
    const { store, setStore } = minitel.store;
    output.cls();
    output.pos(3, 5);
    output.print(`Welcome to Minitel TS! ${store.loop || 0}`);

    await minitel.input.waitForKey();
    setStore({userInput: ''})
    minitel.bip();
    minitel.router.goto('index');
    
}

