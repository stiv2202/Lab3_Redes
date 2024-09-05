const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require("../mediator.js");

const flooding = async (from, to, message) => { // Se asume que el formato de message viene como un objeto

    const deleteResource = (jid) => {
        return jid.split('/')[0];
    }


    const names = (await readJsonFile("./names.json")).config
    const name = deleteResource(to);

    // Obtener nodo actual
    const node = Object.keys(names).find(key => names[key] === to);

    console.log(`Nodo actual: ${node}`);

    // Verificar si este nodo es el destinatario final
    if (name === message.to) {
        console.log(`\nMensaje recibido de ${message.from}`);
        console.log(message);
        return;
    }

    // Verificar si el mensaje tiene hops agotados
    if (message.hops <= 0) {
        console.log(`\nMensaje de ${message.from} a ${message.to} con hops agotados.`);
        return;
    }

    let [_, neighbors] = await initTable(node);

    console.log(`Vecinos: ${neighbors}`)
    console.log(`Names: ${names}`)

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (message) => { 

        neighbors.forEach(n => {
            if (message.hops <= 0) return;
            
            if (names[n] === deleteResource(from)) {
                return;
            }

            message.hops -= 1;
            sendMessage(name, names[n], JSON.stringify(message)); // Enviar el cuerpo del mensaje como un string
        });

    };

    setTimeout(() => {
        floodMessage(message);
    }, 100);
}

module.exports = {
    flooding,
};
