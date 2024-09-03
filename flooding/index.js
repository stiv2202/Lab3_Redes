const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require("../mediator.js");

const flooding = async (message) => { // Se asume que el formato de message viene como un objeto

    console.log('message: ',message)

    const names = (await readJsonFile("./names.json")).config
    const name = message.to;

    // Obtener nodo actual
    const node = Object.keys(names).find(key => names[key] === message.to);
    
    const originalFrom = message.from;

    const sourceNode = Object.keys(names).find(key=> names[key] == originalFrom)

    if (sourceNode)
        console.log(`Mensaje recibido de ${originalFrom}:\n${message.data}`);
    else
        console.log('Nodo inicial.')

    let [_, neighbors] = await initTable(node);

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (message) => { 

        neighbors.forEach(n => {
            if (message.hops <= 0) return;
            
            if (names[n] === originalFrom) {
                console.log(`Saltando mensaje`);
                return;
            }

            console.log(`Enviando mensaje a ${n}`);

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
