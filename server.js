const { JSDOM } = require('jsdom');
const { Strophe, $msg, $pres } = require('strophe.js');
const { ALGORITHM } = require('./consts');
const { distanceVectorReceive } = require('./distance-vector');
const { setSendMessage, setSendEchoMessage } = require('./mediator.js');
const { decodeHtmlEntities, verifyName } = require('./utils.js');
const { dijkstraSend } = require('./dijkstra/index.js');
const { flooding } = require('./flooding/index.js');
const XMPP_SERVER = 'ws://alumchat.lol:7070/ws';
const DOMAIN_NAME = 'alumchat.lol';
const RESOURCE = 'LAB3';

const { window } = new JSDOM('');
global.document = window.document;
global.window = window;

const connection = new Strophe.Connection(XMPP_SERVER);

const login = (username, password, node) => {
    return new Promise((resolve, reject) => {
        let connectionTimeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
        }, 30000); // 30 seconds timeout

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
    const bodyElement = message.getElementsByTagName('body')[0];
    if (bodyElement) {
        let body = Strophe.getText(bodyElement);
        body = decodeHtmlEntities(body)

        try {
            const jsonBody = JSON.parse(body)

            switch (jsonBody.type) {
                case 'info':
                    switch (ALGORITHM) {
                        case 'distance-vector':
                            distanceVectorReceive(jsonBody, from)
                            break;

                        case 'dijkstra':
                            console.log(`Mensaje recibido de ${from}: ${body}`);

                            dijkstraSend(jsonBody);
                            break;

                        case 'flooding':
                            flooding(jsonBody);
                            break;
                        default:
                            console.log("Algoritmo no válido. Imprimiendo mensaje en crudo.")
                            console.log(`Mensaje recibido de ${from}: ${body}`);
                            break;
                    }
                    break;
                // case 'echo':
                //     if (jsonBody.hops === 0) {
                //         break;
                //     }
                //     const newHops = jsonBody.hops + 1
                //     const newMessage = jsonBody
                //     newMessage.from = jsonBody.to
                //     newMessage.to = jsonBody.from
                //     newMessage.hops = newHops
                //     sendMessage(newMessage.from, newMessage.to, JSON.stringify(newMessage))
                //     break;
                case 'echo':
                    console.log('Mensaje de eco recibido.')
                    break;
                default:
                    console.log("Tipo no válido. Imprimiendo mensaje en crudo.")
                    console.log(`Mensaje recibido de ${from}: ${body}`);
                    break;
            }

        } catch (e) {
            // El mensaje recibido no es de tipo JSON o no es válido
            console.log(`Mensaje recibido de ${from}: ${body}`);
        }
    }

    return true;
}

const sendEchoMessage = (myNode, targetNode) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const echoMessage = {
            id: `${targetNode.split('@')[0]}-${Date.now()}`, // Un ID único para cada mensaje
            type: "echo",
            from: myNode,
            to: targetNode,
            hops: 1,
            payload: 'Echo message'
        }
        const message = $msg({
            to: targetNode,
            from: myNode,
            type: 'chat'
        }).c('body').t(JSON.stringify(echoMessage));

        connection.send(message);
        const handler = connection.addHandler((msg) => {
            const from = msg.getAttribute('from');
            const bodyElement = msg.getElementsByTagName('body')[0];
            if (bodyElement) {
                let body = Strophe.getText(bodyElement);
                body = decodeHtmlEntities(body)

                try {
                    const jsonBody = JSON.parse(body)
                    if (jsonBody.type === 'echo') {
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
        }, 20000);
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
    });
    connection.send(presence);
}

module.exports = {
    login,
};
