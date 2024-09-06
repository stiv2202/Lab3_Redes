const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require("../mediator.js");

const flooding = async (previousNodeName, currNodeName, message) => { // Se asume que el formato de message viene como un objeto

    const deleteResource = (jid) => {
        return jid.split('/')[0];
    }


    const names = (await readJsonFile("./names.json")).config
    const currentNodeName = deleteResource(currNodeName);

    // Obtener nodo actual
    const currentNode = Object.keys(names).find(key => names[key] === currentNodeName);

    console.log(`Nodo actual: ${currentNode}`);

    // Verificar si este nodo es el destinatario final
    if (currentNodeName === message.to) {
        console.log(`\nMensaje recibido de ${message.from}`);
        console.log(message);
        return;
    }

    // Verificar si el mensaje tiene hops agotados
    if (message.hops <= 0) {
        console.log(`\nMensaje de ${message.from} a ${message.to} con hops agotados.`);
        return;
    }

    
    let [_, neighbors] = await initTable(currentNode);
    
    // Verificar si un vecino es el destinatario final
    const destUserNode = Object.keys(names).find(key => names[key] === deleteResource(message.to));
    if(destUserNode && neighbors.includes(destUserNode)) {
        const msgCopy = {...message};
        msgCopy.type = "message";
        msgCopy.hops -= 1;
        sendMessage(currentNodeName, msgCopy.to, JSON.stringify(msgCopy));
        console.log("Enviamos el mensaje al destinatario final, nodo vecino ", destUserNode);
        return;
    }



    console.log(`Vecinos: ${neighbors}`)

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (message) => { 
        const nextHops = message.hops - 1;
        neighbors.forEach(n => {
            if (message.hops <= 0) return;
            
            if (names[n] === deleteResource(previousNodeName)) {
                return;
            }

            message.hops = nextHops;
            sendMessage(currentNodeName, names[n], JSON.stringify(message)); // Enviar el cuerpo del mensaje como un string
        });

    };

    setTimeout(() => {
        floodMessage(message);
    }, 100);
}

module.exports = {
    flooding,
};
