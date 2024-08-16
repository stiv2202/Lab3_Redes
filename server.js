const { JSDOM } = require('jsdom');
const { Strophe, $msg, $pres } = require('strophe.js');
const XMPP_SERVER = 'ws://alumchat.lol:7070/ws';
const DOMAIN_NAME = 'alumchat.lol';
const USERNAME = 'gue21781-user';
const PASSWORD = 'lizamiranda';
const RESOURCE = 'distance-vector';

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
    const body = Strophe.getText(bodyElement);



    console.log(`Mensaje recibido de ${from}: ${body}`);
  }

  return true;
}

const sendMessage = (from, to, body) => {
  let fullFrom = `${USERNAME}@${DOMAIN_NAME}`
  to = `${to}${RESOURCE.trim() != '' ?  `/${RESOURCE}` : '' }`
  fullFrom = `${from}${RESOURCE.trim() != '' ?  `/${RESOURCE}` : '' }`
  const message = $msg({
    to,
    fullFrom,
    type: 'chat'
  }).c('body').t(body);

  connection.send(message);
}

const sendPresence = () => {
  const presence = $pres({
    type: 'available'
  });
  connection.send(presence);
}

// setTimeout(() => {
//   console.log('Desconectando...');
//   connection.disconnect();
// }, 50000);

module.exports = {
  login,
  sendMessage
}