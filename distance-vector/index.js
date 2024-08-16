const { initTable } = require('../utils.js');
const { sendMessage } = require('../mediator.js');
let { updateTable } = require('../enviroment.js');
const { getNode, getTable } = require('../enviroment.js');

const distanceVectorSend = async (name, node, names, message) => {
    const [table, neighbors] = await initTable(node);

    updateTable(table)

    message.payload = table;

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
    console.log("NODE: ", getNode())
    console.log("TABLE", getTable())
}

module.exports = {
    distanceVectorReceive,
    distanceVectorSend
};
