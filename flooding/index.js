const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require("../mediator.js");
let { getNode } = require('../enviroment.js');

const flooding = async (message) => { // Se asume que el formato de message viene como un objeto

    const names = (await readJsonFile("./names.json")).config
    const startNode = getNode()
    const destinationNode = Object.keys(names).find((key) => names[key] === message.to)
    const originalFrom = message.from

    if (!destinationNode){
        console.error(`\nEl nodo ${message.to} no forma parte de la red.\n`);
        return
    }

    if (startNode === destinationNode) {
        console.log("El mensaje llegó a su destino!: ", message);
        return;
    }

    let [_, neighbors] = await initTable(startNode);

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (message) => { 

        neighbors.forEach(n => {
            if (message.hops <= 0) return;
            
            if (names[n] === originalFrom) {
                return;
            }

            message.hops -= 1;
            sendMessage(names[startNode], names[n], JSON.stringify(message)); // Enviar el cuerpo del mensaje como un string
        });

        if (message.hops <= 0) {
            return;
        }
    };

    setTimeout(() => {
        floodMessage(message);
    }, 100);
}

module.exports = {
    flooding
};
