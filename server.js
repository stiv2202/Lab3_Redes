const { JSDOM } = require('jsdom');
const { Strophe, $msg, $pres } = require('strophe.js');
const { ALGORITHM } = require('./consts');
const { distanceVectorReceive, distanceVectorSend } = require('./distance-vector');
const { setSendMessage, setSendEchoMessage } = require('./mediator.js');
const { decodeHtmlEntities } = require('./utils.js');
const { dijkstraSend } = require('./dijkstra/index.js');
const { flooding } = require('./flooding/index.js');
const { linkStateSend } = require('./link-state/index.js');
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
                    switch (ALGORITHM) {
                        case 'distance-vector':
                            distanceVectorReceive(jsonBody, from, to);
                            break;
                        case 'flooding':
                            flooding(jsonBody);
                            break;
                        case 'link-state':
                            linkState.receiveWeights(jsonBody.from, jsonBody.table, jsonBody.version);
                            break;
                        default:
                            console.log("Algoritmo no válido. Imprimiendo mensaje en crudo.");
                            console.log(`Mensaje recibido de ${from}: ${body}`);
                            break;
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
                    linkStateSend(jsonBody);
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
            console.log(`Mensaje recibido de ${from}: ${body}`);
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

setSendEchoMessage(sendEchoMessage);

const sendMessage = (from, to, body) => {
    from = `${from}@${DOMAIN_NAME}`;
    from = `${from}${RESOURCE.trim() != '' ? `/${RESOURCE}` : ''}`;
    to = `${to}${RESOURCE.trim() != '' ? `/${RESOURCE}` : ''}`;
    const message = $msg({
        to,
        from,
        type: 'chat'
    }).c('body').t(body);

    connection.send(message);
};

setSendMessage(sendMessage);

const sendPresence = () => {
    const presence = $pres({
        type: 'available'
    }).c('priority').t('50');
    connection.send(presence);
}

module.exports = {
    login,
};
