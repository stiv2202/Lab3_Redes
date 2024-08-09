import { client, xml } from '@xmpp/client';
import debug from '@xmpp/debug';
import domainName from './consts.js';

const xmpp = client({
  service: 'ws://alumchat.lol:7070/ws',
  domain: 'alumchat.lol',
  resource: 'example',
  username: 'gue21781-user',
  password: 'lizamiranda',
});

debug(xmpp, true);

xmpp.on('error', (err) => {
  console.error('Error:', err);
});

xmpp.on('offline', () => {
  console.log('Offline');
});

xmpp.on('stanza', async (stanza) => {
  if (stanza.is('message') && stanza.getChild('body')) {
    console.log('Received message:', stanza.getChildText('body'));
  }
});

xmpp.on('online', async (address) => {
  console.log(`Online as ${address}`);
});

async function startServer() {
  try {
    await xmpp.start();
    console.log('XMPP client started');
  } catch (err) {
    console.error('Failed to start XMPP client:', err);
  }
}

async function sendMessage(to, body) {
  try {
    const message = xml(
      'message',
      { type: 'chat', to },
  xml('body', {}, body)
    );
  await xmpp.send(message);
  console.log(`Message sent to ${to}`);
} catch (err) {
  console.error('Failed to send message:', err);
}
}

async function stopServer() {
  try {
    await xmpp.send(xml('presence', { type: 'unavailable' }));
    await xmpp.stop();
    console.log('XMPP client stopped');
  } catch (err) {
    console.error('Failed to stop XMPP client:', err);
  }
}

// (async () => {
//   await startServer();

//   // Optional: Send a message after starting the server
//   await sendMessage('gue21781-test@alumchat.lol/example', 'hello world');

//   // Optional: Uncomment to test stopping the server after 5 seconds
//   // setTimeout(stopServer, 5000);
// })();

export {
  startServer,
  stopServer,
  sendMessage,
}
