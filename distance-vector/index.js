const { initTableDV, verifyName, readJsonFile, infiniteTableDV, isTableEmpty } = require('../utils.js');
const { sendMessage } = require('../mediator.js');
let { updateTable, getNode } = require('../enviroment.js');
const { getTable } = require('../enviroment.js');

const lastUpdate = {};

const waitForTableUpdate = (startNode, destinationNode, timeout = 1000000) => {
    return new Promise((resolve, reject) => {
        const interval = 100; // Check every 100ms
        const start = Date.now();

        const checkTable = () => {
            const table = getTable();
            if (table[startNode] && table[startNode][destinationNode] !== null) {
                resolve(table);
            } else if (Date.now() - start >= timeout) {
                reject(new Error(`Timeout: Table was not populated for node ${startNode} within ${timeout}ms.`));
            } else {
                setTimeout(checkTable, interval);
            }
        };

        checkTable();
    });
};

const distanceVectorSend = async (message) => {
    const names = (await readJsonFile("./names.json")).config
    const startNode = getNode()
    const destinationNode = Object.keys(names).find((key) => names[key] === message.to)

    if (!destinationNode){
        console.error(`\nEl nodo ${message.to} no forma parte de la red.\n`);
        return
    }

    if (startNode === destinationNode) {
        console.log("El mensaje llegó a su destino!: ", message);
        return;
    }

    try {
        console.log('Calculando siguiente salto...')
        const table = await waitForTableUpdate(startNode, destinationNode);
        const vector = table[startNode];
        const nextNode = typeof vector[destinationNode] === 'number' ? destinationNode : vector[destinationNode][1];

        sendMessage(names[startNode], names[nextNode], JSON.stringify(message));

        console.log(`Mensaje transferido a ${nextNode}: ${names[nextNode]}`)
    } catch (error) {
        console.error(`\n${error}\n`);
    }
}

const distanceVectorStart = async (name, node, names) => {
    message = {
        type: "weights",
        version: 0,
        from: `${name}@alumchat.lol`,
    }
    const [table, neighbors] = await initTableDV(node, names);
    updateTable(table)
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
        console.error('La actualización de pesos no proviene de un miembro conocido de la red.')
        return
    }

    lastUpdate[source] = (lastUpdate[source] || 0) + 1;
    lastUpdate[source] = Date.now();

    const myNode = Object.keys(names).find(key => names[key] === destine);
    let currentTable = getTable()
    if (isTableEmpty(currentTable)) {
        return
    }
    currentTable[source] = info
    const myVector = currentTable[myNode]
    const distanceToSource = myVector[source] === null ? Number.POSITIVE_INFINITY
        : typeof myVector[source] === 'number' ? myVector[source] : myVector[source][0]
    info[myNode] = info[myNode] === null ? Number.POSITIVE_INFINITY : info[myNode]
    myVector[source] = myVector[source] <= info[myNode] ? myVector[source] : typeof info[myNode] === 'number' ? info[myNode] : info[myNode][0]

    Object.keys(myVector).forEach((node) => {
        if (currentTime - lastUpdate[node] > 10000) {
            return;
        }
        let distanceToNode = myVector[node] === null ? Number.POSITIVE_INFINITY : typeof myVector[node] === 'number' ? myVector[node] : myVector[node];
        let mediator = undefined;
        const sourceToNode = info[node] === null ? null : typeof info[node] === 'number' ? info[node] : info[node][0]

        if (Array.isArray(distanceToNode)) {
            mediator = distanceToNode[1]
            distanceToNode = distanceToNode[0]
        }

        if (mediator === source) {
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
    distanceVectorStart,
    distanceVectorSend,
};
