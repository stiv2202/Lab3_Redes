const { JSDOM } = require('jsdom');
const { Strophe, $msg, $pres } = require('strophe.js');
const { ALGORITHM } = require('./consts');
const { distanceVectorReceive } = require('./distance-vector');
const { setSendMessage } = require('./mediator.js');
const { decodeHtmlEntities } = require('./utils.js')
const XMPP_SERVER = 'ws://alumchat.lol:7070/ws';
const DOMAIN_NAME = 'alumchat.lol';
const RESOURCE = 'LAB3';

const { window } = new JSDOM('');
global.document = window.document;
global.window = window;

const connection = new Strophe.Connection(XMPP_SERVER);

const login = (username, password) => {
    connection.connect(`${username}@${DOMAIN_NAME}/${RESOURCE}`, password, (status) => {
        switch (status) {
            case Strophe.Status.CONNECTED:
                console.log(`Conectado exitosamente como ${username}@${DOMAIN_NAME}/${RESOURCE}`);
                connection.addHandler(onMessage, null, 'message', 'chat', null);
                sendPresence();
                break;
            case Strophe.Status.DISCONNECTED:
                console.log('Desconectado del servidor XMPP.');
                break;
            case Strophe.Status.CONNFAIL:
                console.error('Falló la conexión al servidor XMPP.');
                break;
            case Strophe.Status.AUTHFAIL:
                console.error('Falló la autenticación.');
                break;
            default:
                console.log(`Estado de conexión: ${status}`);
                break;
        }
    });
}

const onMessage = (message) => {
    const from = message.getAttribute('from');
    const bodyElement = message.getElementsByTagName('body')[0];
    if (bodyElement) {
        let body = Strophe.getText(bodyElement);
        body = decodeHtmlEntities(body)

        console.log("body: ", body)

        try {
            const jsonBody = JSON.parse(body)

            switch (jsonBody.type) {
                case 'info':
                    switch (ALGORITHM) {
                        case 'distance-vector':
                            distanceVectorReceive(jsonBody.payload)
                            break;
                        default:
                            console.log("Algoritmo no válido. Imprimiendo mensaje en crudo.")
                            console.log(`Mensaje recibido de ${from}: ${body}`);
                            break;
                    }
                    break;
                default:
                    console.log("Tipo no válido. Imprimiendo mensaje en crudo.")
                    console.log(`Mensaje recibido de ${from}: ${body}`);
                    break;
            }

        } catch (e) {
            // El mensaje recibido no es de tipo JSON o no es válido
            console.log("Error >>>>>>>>", e);
            console.log(`Mensaje recibido de ${from}: ${body}`);
        }
    }

    return true;
}

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
    login
};
