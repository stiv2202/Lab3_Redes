const { initTableDV, verifyName, readJsonFile, infiniteTableDV, isTableEmpty } = require('../utils.js');
const { sendMessage } = require('../mediator.js');
let { updateTable } = require('../enviroment.js');
const { getTable } = require('../enviroment.js');

const distanceVectorSend = async (name, node, names, message) => {
    const [table, neighbors] = await initTableDV(node, names);
    updateTable(table)
    console.log("Tabla actualizada: ", table)
    setInterval(() => {

        message.payload = table[node];
        neighbors.forEach(n => {
            message.to = n;
            sendMessage(name, n, JSON.stringify(message));
        });
    }, 10000);
}

const distanceVectorReceive = async (message, source) => {
    const info = message.payload
    source = source.split('@')[0]
    source = await verifyName(source)
    const names = (await readJsonFile("./names.json")).config
    if (!source) {
        console.log('El mensaje entrante no proviene de un miembro conocido de la red.')
        return
    }

    const myNode = Object.keys(names).find(key => names[key] === message.to);
    let currentTable = getTable()
    if (isTableEmpty(currentTable)) {
        return
    }
    console.log("TABLE", currentTable)
    currentTable[source] = info
    const myVector = currentTable[myNode]
    const distanceToSource = typeof myVector[source] === 'number' ? myVector[source] : myVector[source][0]
    info[myNode] = info[myNode] === null ? Number.POSITIVE_INFINITY : info[myNode]
    myVector[source] = myVector[source] <= info[myNode] ? myVector[source] : typeof info[myNode] === 'number' ? info[myNode] : info[myNode][0]

    Object.keys(myVector).forEach((node) => {
        const distanceToNode = myVector[node] === null ? Number.POSITIVE_INFINITY : typeof myVector[node] === 'number' ? myVector[node] : myVector[node][0];
        const sourceToNode = info[node] === null ? null : typeof info[node] === 'number' ? info[node] : info[node][0]
        if (distanceToSource + sourceToNode < distanceToNode && sourceToNode !== null)
            myVector[node] = source === myNode ? distanceToSource + sourceToNode : [distanceToSource + sourceToNode, source]
    })
    currentTable[myNode] = myVector


    updateTable(currentTable)

    // Object.keys(info).forEach((node) => {
    //     if (!Object.keys(currentTable).includes(node))
    //         currentTable[node] = [info[node], source]
    //     else if (info[node] < currentTable[node])
    //         currentTable[node] = [info[node], source]
    //     updateTable(currentTable)
    // })
}

module.exports = {
    distanceVectorReceive,
    distanceVectorSend
};
