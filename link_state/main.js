const { readJsonFile, getNeighbors, getNode, getName } = require("./utils.js");
const { input } = require("./utils.js");
const { login, sendEchoMessage, sendWeightsTableToNeighbours, dijkstraSend } = require("./server.js");
const { modifyNodeWeights } = require("./link-state/weightsTable.js");
const { setUser } = require("./enviroment.js");


const updateNodeWeights = async (user) => {

		const node = await getNode(user);
    const neighbors = await getNeighbors(node);
    const weights = {};

    for(let neighbor of neighbors) {
        try{
						const neighborUser = await getName(neighbor);
            weights[neighbor] = await sendEchoMessage(user, neighborUser);
        } catch (error) {
            //console.log("Echo timeout con vecino: ", neighbor);
            weights[neighbor] = Infinity;
        }
    }

    const version = await modifyNodeWeights(user, weights);
    sendWeightsTableToNeighbours(weights, version, user); // Enviar tabla de pesos a los vecinos
}


const main = async () => {
	try {
		let username = await input("Ingresa tu usuario de '@alumchat.lol': ");
		let password = await input("Ingresa tu contraseña: ");

		await login(username, password);    
        setUser(username);

		console.log("Presione Enter para iniciar el programa");

        // Actualizar pesos de nodo actual al inicio y cada 10 segundos
        updateNodeWeights(username);
        setInterval(() => {
            updateNodeWeights(username);
        }, 20000);

		process.stdin.once("data", async () => {
			console.log(`Iniciando algoritmo...`);

			repeat = true;
			while (repeat) {
				await input("Ingrese el nombre del usuario destino (@alumchat.lol): ").then(
					async (destination) => {
						const message = {
							type: "message",
							to: destination,
							from: username,
							data: await input("Ingrese el mensaje a enviar: "),
						};

						console.log("Enviando mensaje con link-state...");
                        dijkstraSend(message);
						
						// Pregunta si se desea enviar otro mensaje
						const sendAnother = await input("¿Quieres enviar otro mensaje? (s): ");
						if (sendAnother.toLowerCase() !== "s" && sendAnother !== "") {
							repeat = false;
						}
					}
				);
			}
		});
	} catch (error) {
		console.error("Inicio de sesión fallido:", error);
		process.exit(1);
	}
};

main();
