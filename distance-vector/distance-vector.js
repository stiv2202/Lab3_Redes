import { initTable, input, readJsonFile, verifyName } from './utils.js'
import { startServer, sendMessage } from './server.js'

let name = await input("Ingresa tu usuario de '@alumchat.lol': ");
name = name.split('@')[0];

const names = (await readJsonFile("names.json")).config

const node = await verifyName(name);
if (!node) {
    process.exit(1);
}

console.log(`¡Bienvenido: ${name}!`);

let [table, neighbors] = await initTable(node)

await startServer()
setInterval(() => {
    neighbors.forEach(n => {
        sendMessage(names[n], JSON.stringify(table)); 
    });    
  }, 5000);
