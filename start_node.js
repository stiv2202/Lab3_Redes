const { login } = require('./server.js');
const { input, verifyName } = require('./utils.js');

const startNode = async () => {
    let username = await input("Ingresa tu usuario de '@alumchat.lol': ");
    username = username.split('@')[0].toLowerCase();
    let password = await input("Ingresa tu contraseña: ");

    const node = await verifyName(username);
    if (!node) {
        process.exit(1);
    }

    login(username, password);

    console.log(`ESTE ES EL NODO ${node}`);

    return [username, node]
}

// startNode();

module.exports = { startNode }