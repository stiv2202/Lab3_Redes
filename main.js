const { readJsonFile } = require('./utils.js')
const { flooding } = require('./flooding')
const { startNode } = require('./start_node.js')
const { ALGORITHM } = require('./consts.js')
let { updateNode } = require('./enviroment.js')
const { distanceVectorSend } = require('./distance-vector')

const main = async () => {
    const [name, node] = await startNode()
    updateNode(node)
    const names = (await readJsonFile("./names.json")).config
    
    console.log(`¡Bienvenido: ${name}!`);

    console.log(`Iniciando algoritmo ${ALGORITHM}...`);

    const message = {
        id: `${name}-${Date.now()}`, // Un ID único para cada mensaje
        type: "info",
        from: `${name}@alumchat.lol`,
        hops: 3,
        payload: `${name} says hello!`
    }

    switch (ALGORITHM) {
        case 'flooding':
            // const message = {
            //     id: `${name}-${Date.now()}`, // Un ID único para cada mensaje
            //     type: "flooding",
            //     from: `${name}@alumchat.lol`,
            //     hops: 10,
            //     payload: `${name} says hello!`
            // };

            // message.payload = `${name} says hello!`

            flooding(name, node, names, message);
            break;
        case 'distance-vector':
            distanceVectorSend(name, node, names, message)
            break;
        default:
            console.log("Algoritmo no válido.")
            break;
    }
}

main()