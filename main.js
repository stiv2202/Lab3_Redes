const { input, readJsonFile, verifyName } = require('../utils.js')
const { flooding } = require('./flooding.js')
const ALGORITHM = 'flooding';

const main = async () => {
    let name = await input("Ingresa tu usuario de '@alumchat.lol': ");
    name = name.split('@')[0];

    const node = await verifyName(name);
    if (!node) {
        process.exit(1);
    }

    console.log(`¡Bienvenido: ${name}!`);

    console.log(`Iniciando algoritmo ${ALGORITHM}...`);

    if (ALGORITHM === 'flooding') {

        const message = {
            id: `${name}-${Date.now()}`, // Un ID único para cada mensaje
            type: "flooding",
            from: `${name}@alumchat.lol`,
            hops: 10,
            payload: `${name} says hello!`
        };

        flooding(name, message);
    }
}

main();