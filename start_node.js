const { login } = require('./server.js');
const { input, verifyName } = require('./utils.js');

const startNode = async () => {
    let username = await input("Ingresa tu usuario de '@alumchat.lol': ");
    username = username.split('@')[0].toLowerCase();
    let password = await input("Ingresa tu contraseña: ");

    const node = await verifyName(username);
    if (!node) {
        throw new Error('Nodo no válido');
    }

    return await login(username, password, node);
}

// startNode();

module.exports = { startNode }