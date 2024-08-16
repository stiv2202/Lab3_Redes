const { initTable, input, readJsonFile, verifyName } = require('./utils.js')
const { login, sendMessage } = require('./server.js');

const main = async () => {
    let name = await input("Ingresa tu usuario de '@alumchat.lol': ");
    name = name.split('@')[0];

    const names = (await readJsonFile("names.json")).config

    const node = await verifyName(name);
    if (!node) {
        process.exit(1);
    }

    console.log(`¡Bienvenido: ${name}!`);

    let [table, neighbors] = await initTable(node)

    login()
    setInterval(() => {
        console.log("Enviando vecinos...")
        neighbors.forEach(n => {

            let message = {
                "type": "info",
                "from": `${name}@alumchat.lol`,
                "to": names[n],
                "hops": 3,
                "payload": table
            }

            sendMessage(names[n], JSON.stringify(message));
        });
    }, 3000);

}

main()