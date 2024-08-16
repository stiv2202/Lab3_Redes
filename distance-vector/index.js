const { initTable } = require('../utils.js');
const { sendMessage } = require('../mediator.js');
let { TABLE } = require('./enviroment.js');

const distanceVectorSend = async (name, node, names, message) => {
    let neighbors;
    [TABLE, neighbors] = await initTable(node);

    message.payload = TABLE;

    setInterval(() => {
        console.log("Enviando vecinos...");
        neighbors.forEach(n => {
            message.to = names[n];
            sendMessage(name, names[n], JSON.stringify(message));
        });
    }, 3000);
}

const distanceVectorReceive = async (info) => {
    console.log("info: ", info)
}

module.exports = {
    distanceVectorReceive,
    distanceVectorSend
};
