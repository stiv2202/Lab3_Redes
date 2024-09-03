const { readJsonFile } = require('./utils.js')
const { flooding } = require('./flooding')
const { startNode } = require('./start_node.js')
const { ALGORITHM } = require('./consts.js')
let { updateNode } = require('./enviroment.js')
const { distanceVectorStart, distanceVectorSend } = require('./distance-vector')
const { dijkstraSend } = require('./dijkstra/index.js')
const { linkStateSend } = require('./link-state')
const { input } = require('./utils.js');

const main = async () => {
    try {
        const [name, node] = await startNode()
        console.log(`ESTE ES EL NODO ${node}`);
        updateNode(node)
        const names = (await readJsonFile("./names.json")).config

        console.log(`¡Bienvenido: ${name}!`);

        let message = {
            id: `${name}-${Date.now()}`, // Un ID único para cada mensaje // NO LO TOMAN LOS OTROS GRUPOS
            type: "weights", // Válidios: weights, echo, echo_response, send_routing, message
            from: `${name}@alumchat.lol`,
            to: "zam21780-lab3-3@alumchat.lol",
            hops: 3,
            table: `${name} says hello!` //Anteriormente Payload. Va en el formato de WEIGHTS
            /* Otras etiquetas
                version: Versión de la tabla enviada. Verifica si es necesario o no actualizar la tabla actual. (weights)
                to: Describe para quién es el mensaje enviado. (send_routing)
                data: Mensaje enviado (send_routing)

            */


            /*
                Posibles modificaciones:
                No usar ID para evitar conflictos con otros grupos.
                Manejar TO solo cuando es de tipo send_routing.
                Agregar soporte para enviar mensaje de un nodo a otro, tomando en cuenta la ruta según el algoritmo.
                Modificar el switch en onMessage con los types adecuados para cada caso.
            */
        }

        console.log("Presione Enter para iniciar el programa");
        process.stdin.once('data', async () => {
            console.log(`Iniciando algoritmo ${ALGORITHM}...`);

            switch (ALGORITHM) {
                case 'flooding':
                    message = {
                        id: `${name}-${Date.now()}`, // Un ID único para cada mensaje
                        type: "message",
                        from: 'nadie. Nodo inicial',
                        to: `${name}@alumchat.lol`, // Nombre del nodo inicial
                        hops: 10,
                        data: `${name} says hello!`
                    }

                    flooding(message);
                    break;
                case 'distance-vector':
                    distanceVectorStart(name, node, names)
                    repeat = true
                    while (repeat) {
                        await input("Ingrese el nombre del usuario destino (@alumchat.lol): ").then(async (destinationName) => {
                            const message = {
                                type: "message",
                                to: `${destinationName}@alumchat.lol`,
                                from: `${name}@alumchat.lol`,
                                data: await input("Ingrese el mensaje a enviar: "),
                            };

                            console.log("Enviando mensaje con distance-vector...");
                            await distanceVectorSend(message);

                            // Pregunta si se desea enviar otro mensaje
                            const sendAnother = await input("¿Quieres enviar otro mensaje? (s): ");
                            if (sendAnother.toLowerCase() !== "s" && sendAnother !== "") {
                                repeat = false;
                            }
                        });
                    }
                    break;

                case 'dijkstra':

                    input("Ingrese el nombre del usuario destino (@alumchat.lol): ").then(async (destinationName) => {
                        message = {
                            type: "message",
                            to: `${destinationName}@alumchat.lol`,
                            from: `${name}@alumchat.lol`,
                            data: await input("Ingrese el mensaje a enviar: "),
                        }

                        console.log("Enviando mensaje con dijkstra...")
                        dijkstraSend(message)
                    });


                    break;
                case 'link-state':
                    input("Ingrese el nombre del usuario destino (@alumchat.lol): ").then(async (destinationName) => {
                        message = {
                            type: "message",
                            to: `${destinationName}@alumchat.lol`,
                            from: `${name}@alumchat.lol`,
                            data: await input("Ingrese el mensaje a enviar: "),
                        };

                        console.log("Enviando mensaje con link-state...");
                        linkStateSend(message);
                    });
                    break;

                default:
                    console.log("Algoritmo no válido.");
                    break;
            }
        });
    } catch (error) {
        console.error('Inicio de sesión fallido:', error);
        process.exit(1)
    }
}

main();