const { initTableDV, verifyName, readJsonFile, infiniteTableDV, isTableEmpty } = require('../utils.js');
const { sendMessage } = require('../mediator.js');
let { updateTable } = require('../enviroment.js');
const { getTable } = require('../enviroment.js');

const lastUpdate = {};

const distanceVectorSend = async (name, node, names, message) => {
    const [table, neighbors] = await initTableDV(node, names);
    updateTable(table)
    console.log("Tabla actualizada: ", table)
    setInterval(() => {

        message.table = table[node];
        neighbors.forEach(n => {
            sendMessage(name, n, JSON.stringify(message));
        });
    }, 10000);
}

const verifyRoutes = (table, lastUpdate, myNode) => {
    const currentTime = Date.now();
    Object.keys(table).forEach((node) => {
        // Si no ha habido actualizaciones en los últimos 10000 ms (10 segundos)
        if (currentTime - lastUpdate[node] > 10000) {
            Object.keys(table[myNode]).forEach((destNode) => {
                if (Array.isArray(table[myNode][destNode]) && table[myNode][destNode][1] === node) {
                    table[myNode][destNode] = Number.POSITIVE_INFINITY;
                }
            });

            table[myNode][node] = Number.POSITIVE_INFINITY;
            delete table[node];
        }
    });
    return table;
};

const distanceVectorReceive = async (message, source, destine) => {
    const info = message.table
    const currentTime = Date.now();
    source = source.split('@')[0]
    source = await verifyName(source)
    const names = (await readJsonFile("./names.json")).config
    if (!source) {
        console.log('El mensaje entrante no proviene de un miembro conocido de la red.')
        return
    }

    console.log('lastUpdate: ', lastUpdate);

    lastUpdate[source] = (lastUpdate[source] || 0) + 1;
    lastUpdate[source] = Date.now();

    const myNode = Object.keys(names).find(key => names[key] === destine);
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
        if (currentTime - lastUpdate[node] > 10000) {
            return;
        }
        let distanceToNode = myVector[node] === null ? Number.POSITIVE_INFINITY : typeof myVector[node] === 'number' ? myVector[node] : myVector[node];
        let mediator = undefined;
        const sourceToNode = info[node] === null ? null : typeof info[node] === 'number' ? info[node] : info[node][0]

        if (Array.isArray(distanceToNode)){
            mediator = distanceToNode[1]
            distanceToNode = distanceToNode[0]
        }

        if(mediator === source){
            distanceToNode = distanceToSource + sourceToNode
            myVector[node] = sourceToNode === null ? Number.POSITIVE_INFINITY : [distanceToNode, source]
        } else if (distanceToSource + sourceToNode < distanceToNode && sourceToNode !== null)
            myVector[node] = source === myNode ? distanceToSource + sourceToNode : [distanceToSource + sourceToNode, source]
    })
    currentTable[myNode] = myVector

    currentTable = verifyRoutes(currentTable, lastUpdate, myNode)


    updateTable(currentTable)
}

module.exports = {
    distanceVectorReceive,
    distanceVectorSend
};
