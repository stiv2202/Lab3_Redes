const { initTable, verifyName } = require('../utils.js');
const { sendMessage } = require('../mediator.js');
let { updateTable } = require('../enviroment.js');
const { getTable } = require('../enviroment.js');

const distanceVectorSend = async (name, node, names, message) => {
    const [table, neighbors] = await initTable(node);
    updateTable(table)
    setInterval(() => {

        message.payload = table;

        console.log("Enviando vecinos: ", table)
        console.log("payload: ", message.payload)
        neighbors.forEach(n => {
            message.to = names[n];
            sendMessage(name, names[n], JSON.stringify(message));
        });
    }, 3000);
}

const distanceVectorReceive = async (info, source) => {
    source = source.split('@')[0]
    source = await verifyName(source)
    const currentTable = getTable()
    console.log("TABLE", currentTable)
    Object.keys(info).forEach((node) => {
        if (!Object.keys(currentTable).includes(node))
            currentTable[node] = [info[node], source]
        else if (info[node] < currentTable[node])
            currentTable[node] = [info[node], source]
        updateTable(currentTable)
    })
}

module.exports = {
    distanceVectorReceive,
    distanceVectorSend
};
