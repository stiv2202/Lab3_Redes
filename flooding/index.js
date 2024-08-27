const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require("../mediator.js");

const flooding = async (message) => { // Se asume que el formato de message viene como un objeto

    const names = (await readJsonFile("./names.json")).config
    const node = message.to;
    const name = names[node];
    const originalFrom = message.from;

    console.log(message);

    let [_, neighbors] = await initTable(node);

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (message) => { 

        neighbors.forEach(n => {
            if (message.hops <= 0) return;
            
            console.log(`Enviando mensaje a ${n}`);
            if (n === originalFrom) {
                console.log(`Saltando mensaje`);
                return;
            }

            message.from = node;
            message.hops -= 1;
            message.to = n;
            sendMessage(name, names[n], JSON.stringify(message)); // Enviar el cuerpo del mensaje como un string
        });

        if (message.hops <= 0) {
            console.log("Hops agotados");
            console.log(`Mensaje recibido: ${message.payload}`);
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
