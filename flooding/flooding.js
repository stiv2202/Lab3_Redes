const { initTable, input, readJsonFile, verifyName } = require('../utils.js')
const { sendMessage } = require('../server.js');

const flooding = async (name, messageBody) => {

    const names = (await readJsonFile("names.json")).config
    let [_, neighbors] = await initTable(node);

    // Función para enviar un mensaje a todos los vecinos
    const floodMessage = (messageBody) => { // Se asume que el formato viene como un objeto

        message.hops -= 1;
        if (message.hops <= 0) return;

        neighbors.forEach(n => {
            sendMessage(name, names[n], JSON.stringify(messageBody)); // Enviar el cuerpo del mensaje como un string
        });
    };

    setInterval(() => {
        console.log(`Nodo ${name}: Enviando mensaje de flooding a vecinos...`);
        floodMessage(messageBody);
    }, 1000);
}

module.exports = {
    flooding
};
