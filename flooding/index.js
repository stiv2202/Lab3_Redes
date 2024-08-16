const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require('../server.js');

const flooding = async (name, node, names, message) => {

    let [_, neighbors] = await initTable(node);

    message.payload = `${name} says hello!`
    message.hops = 10

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (message) => { // Se asume que el formato viene como un objeto

        message.hops -= 1;
        if (message.hops <= 0) return;

        neighbors.forEach(n => {
            message.to = names[n],
            sendMessage(name, names[n], JSON.stringify(message)); // Enviar el cuerpo del mensaje como un string
        });
    };

    setInterval(() => {
        console.log(`Nodo ${name}: Enviando mensaje de flooding a vecinos...`);
        floodMessage(message);
    }, 1000);
}

module.exports = {
    flooding
};
