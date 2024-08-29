const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require("../mediator.js");

const flooding = async (message) => { // Se asume que el formato de message viene como un objeto

    const names = (await readJsonFile("./names.json")).config
    const name = message.to;

    // Obtener nodo actual
    const node = Object.keys(names).find(key => names[key] === message.to);

    const originalFrom = message.from;

    console.log(`Mensaje recibido de ${originalFrom}\n`);

    let [_, neighbors] = await initTable(node);

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (message) => { 

        neighbors.forEach(n => {
            if (message.hops <= 0) return;
            
            console.log(`Enviando mensaje a ${n}`);
            if (names[n] === originalFrom) {
                console.log(`Saltando mensaje`);
                return;
            }

            message.from = name;
            message.hops -= 1;
            message.to = names[n];
            sendMessage(name, names[n], JSON.stringify(message)); // Enviar el cuerpo del mensaje como un string
        });

        if (message.hops <= 0) {
            console.log(`Mensaje recibido con hops agotados: ${message.table}`);
            return;
        }
    };

    setTimeout(() => {
        floodMessage(message);
    }, 3000);
}

module.exports = {
    flooding
};
