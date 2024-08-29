const FastPriorityQueue = require("fastpriorityqueue");
const { verifyName, readJsonFile } = require("../utils.js");
const { getNode } = require("../enviroment.js");
const { sendMessage } = require("../mediator.js");

class Graph {

  /**
   * 
   * @param config Objetc. La estructura de la topología debe ser { nodo: [vecinos] }
   */
	constructor(config) {
		this.nodesTable = new Map();

		for (let node in config) {
      // Crear una lista de adyacencia para cada nodo
			this.nodesTable.set(node, []);

      // Agregar a cada vecino a la casilla de su nodo previo en la tabla de adyacencia
			for (let neighbor of config[node]) {
        let nodeRow = this.nodesTable.get(node);
				nodeRow.push({ node: neighbor, weight: 1 });
			}
		}
	}

	dijkstra(startNode) {
		let distances = {};
		let previous = {};
		let priorityQueue = new FastPriorityQueue((a, b) => a.priority < b.priority);

		// Peso inicial = infinito
		for (let node of this.nodesTable.keys()) {
			distances[node] = Infinity;
			previous[node] = null;
		}

		distances[startNode] = 0;
		priorityQueue.add({ node: startNode, priority: 0 });

		while (!priorityQueue.isEmpty()) {
			let { node: minNode } = priorityQueue.poll();
			let neighbors = this.nodesTable.get(minNode);

			for (let neighbor of neighbors) {

        // Distancia si se toma un nodo vecino
				let tempDistance = distances[minNode] + neighbor.weight;

        // Si la distancia hacia ese nodo es menor a la que ya se tiene, se actualiza
				if (tempDistance < distances[neighbor.node]) {

					distances[neighbor.node] = tempDistance;
					previous[neighbor.node] = minNode;
					priorityQueue.add({ node: neighbor.node, priority: tempDistance });
				}
			}
		}

		return { distances, previous };
	}

	shortestPath(startNode, endNode) {
		let result = this.dijkstra(startNode);
		let path = [];
		let currentNode = endNode;

		while (currentNode) {
			path.unshift(currentNode);
			currentNode = result.previous[currentNode];
		}

		return path;
	}
}

/**
 * 
 * @param {*} message Mensaje a enviar. Debe contener obligatoriamente el campo 'to.
 * @param {*} topology La estructura de la topología debe ser { nodo: [vecinos] }
 * Si no se especifica, se asume que la topología es la misma que la del archivo 'topo.json'
 */
const dijkstraSend = async (message, topology=null) => {

  // Cargar topología por default
  if(!topology) {
    const t = await readJsonFile('topo.json');
    topology = t.config;
  }

	const names = await readJsonFile('names.json');

  const startNode = getNode();
	const destinationNode = Object.keys(names.config).find(key => names.config[key] === message.to);

	// Verificar si es el destinatario
	if(startNode === destinationNode) {
		console.log("El mensaje llegó a su destino!: ", message);
		return;
	}
	
	if(!destinationNode) {
		console.log("El usuario destino no está en la topología.");
		return;
	}

  // Calcular el camino
  const graph = new Graph(topology);
  const path = graph.shortestPath(startNode, destinationNode);
	
  // Enviar el mensaje a siguiente nodo
  if(path.length > 1) {
    const nextNode = path[1];
		
		const startNodeName = names.config[startNode];
		const nextNodeName = names.config[nextNode];
		console.log(`Enviando mensaje a siguiente nodo ${nextNodeName}...`);
    sendMessage(startNodeName, nextNodeName, JSON.stringify(message));
  }
}

module.exports = {
  Graph,
	dijkstraSend
}