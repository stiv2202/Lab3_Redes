const { JSDOM } = require('jsdom');
const { Strophe, $msg, $pres } = require('strophe.js');
const { decodeHtmlEntities, getNeighbors, readJsonFile } = require('./utils.js');
const { modifyNodeWeights, getNodeWeights, getWeightsTable } = require('./link-state/weightsTable.js');
const { getUser } = require('./enviroment.js');
const { Graph } = require('./dijkstra/index.js');
const XMPP_SERVER = 'ws://alumchat.lol:7070/ws';
const DOMAIN_NAME = 'alumchat.lol';
const RESOURCE = 'LAB_3';

const { window } = new JSDOM('');
global.document = window.document;
global.window = window;

const connection = new Strophe.Connection(XMPP_SERVER);

let echoSentTimes = {};

const login = (username, password, node) => {
    return new Promise((resolve, reject) => {
        let connectionTimeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
        }, 30000);

        connection.connect(`${username}@${DOMAIN_NAME}/${RESOURCE}`, password, (status) => {
            switch (status) {
                case Strophe.Status.CONNECTING:
                    console.log('Conectando...');
                    break;
                case Strophe.Status.CONNFAIL:
                    clearTimeout(connectionTimeout);
                    reject(new Error('Connection failed'));
                    break;
                case Strophe.Status.AUTHENTICATING:
                    console.log('Authenticating...');
                    break;
                case Strophe.Status.AUTHFAIL:
                    clearTimeout(connectionTimeout);
                    reject(new Error('Authentication failed'));
                    break;
                case Strophe.Status.CONNECTED:
                    clearTimeout(connectionTimeout);
                    console.log(`Conectado exitosamente como ${username}@${DOMAIN_NAME}/${RESOURCE}`);
                    connection.addHandler(onMessage, null, 'message', 'chat', null);
                    sendPresence();
                    resolve([username, node]);
                    break;
                case Strophe.Status.DISCONNECTED:
                    clearTimeout(connectionTimeout);
                    reject(new Error('Disconnected'));
                    break;
            }
        });
    });
}

const onMessage = (message) => {
    const from = message.getAttribute('from');
    const to = message.getAttribute('to').split('/')[0];
    const bodyElement = message.getElementsByTagName('body')[0];
    if (bodyElement) {
        let body = Strophe.getText(bodyElement);
        body = decodeHtmlEntities(body);

        try {
            const jsonBody = JSON.parse(body);
            switch (jsonBody.type) {
                case 'weights':
                    // Verificar si el mensaje es repetido
                    const oldWeights = getNodeWeights(jsonBody.from);
                    if (!oldWeights || oldWeights.version < jsonBody.version) {
                        
                        // Si el mensaje no es repetido, actualizar y enviar a vecinos
                        modifyNodeWeights(jsonBody.from, jsonBody.table);

                        
                        sendWeightsTableToNeighbours(jsonBody.table, jsonBody.version, jsonBody.from, from);
                    }

                    break;
                    
                case 'echo':
                    const echoResponse = {
                        type: 'echo_response'
                    };
                    sendMessage(to.split('@')[0], from, JSON.stringify(echoResponse));
                    break;
                case 'echo_response':
                    break;
                case 'send_routing':
                    console.log("Nodo intermediario, reenviando a siguiente nodo.");
                    dijkstraSend(jsonBody);
                    break;

                case 'message':
                    console.log(`Mensaje recibido: ${jsonBody.data}`);
                    break;
                default:
                    console.log("Tipo no válido. Imprimiendo mensaje en crudo.");
                    console.log(`Mensaje recibido de ${from}: ${body}`);
                    break;
            }

        } catch (e) {
            console.log("Error al parsear", e);
        }
    }

    return true;
}

const sendEchoMessage = (myNode, targetNode) => {
    from = `${myNode}${RESOURCE.trim() != '' ? `/${RESOURCE}` : ''}`;
    to = `${targetNode}${RESOURCE.trim() != '' ? `/${RESOURCE}` : ''}`;
    return new Promise((resolve, reject) => {
        const start = Date.now();
        echoSentTimes[targetNode] = start;

        const echoMessage = {
            type: "echo",
        }
        const message = $msg({
            to,
            from,
            type: 'chat'
        }).c('body').t(JSON.stringify(echoMessage));

        connection.send(message);
        const handler = connection.addHandler((msg) => {
            const bodyElement = msg.getElementsByTagName('body')[0];
            if (bodyElement) {
                let body = Strophe.getText(bodyElement);
                body = decodeHtmlEntities(body);

                try {
                    const jsonBody = JSON.parse(body)
                    if (jsonBody.type === 'echo_response') {
                        connection.deleteHandler(handler);
                        resolve(Date.now() - start);
                    }
                } catch {
                    console.error('El mensaje recibido no es de tipo JSON.')
                }
            }
        }, null, 'message', null, null, null);

        setTimeout(() => {
            connection.deleteHandler(handler);
            reject(new Error('Echo timeout'));
        }, 5000);
    });
}

const sendMessage = (from, to, body) => {
    from = `${from}${RESOURCE.trim() != '' ? `/${RESOURCE}` : ''}`;
    to = `${to}${RESOURCE.trim() != '' ? `/${RESOURCE}` : ''}`;
    const message = $msg({
        to,
        from,
        type: 'chat'
    }).c('body').t(body);

    connection.send(message);
};

const sendWeightsTableToNeighbours = async (table, version, originUser, ignoreNeighbour) => {
    const message = {
        type: "weights",
        table,
        version,
        from: originUser,
    };

    const currentUser = getUser();
    const neighbors = await getNeighbors(currentUser);
    for(let neighbor of neighbors) {
        if (neighbor === ignoreNeighbour) continue;
        sendMessage(currentUser, neighbor, JSON.stringify(message));
    }
}

const dijkstraSend = async (message) => {
	const topology = getWeightsTable();

	const startNode = getUser();
	const destinationNode = message.to;

	// Verificar si es el destinatario
	if (startNode === destinationNode) {
		console.log("El mensaje llegó a su destino!: ", message);
		return;
	}

    
	// Calcular el camino
	const graph = new Graph(topology);
	const path = graph.shortestPath(startNode, destinationNode);
    console.log(startNode, destinationNode, path, topology);

	// Enviar el mensaje a siguiente nodo
	if (path.length > 1) {
		const nextNode = path[1];

		const messageToSend = {
			type: "send_routing",
			to: message.to,
			from: message.from,
			data: message.data,
		};

		if (nextNode === destinationNode) {
			messageToSend.type = "message";
			delete messageToSend.to;
		}

		sendMessage(startNode, nextNode, JSON.stringify(messageToSend));
	}
};

const sendPresence = () => {
    const presence = $pres({
        type: 'available'
    }).c('priority').t('50');
    connection.send(presence);
}

module.exports = {
    login,
    sendEchoMessage,
    sendMessage,
    sendWeightsTableToNeighbours,
    dijkstraSend,
};
