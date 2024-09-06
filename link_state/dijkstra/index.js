const FastPriorityQueue = require("fastpriorityqueue");

class Graph {

  /**
   * 
   * @param config Objetc. La estructura de la topología debe ser { nodo: {vecino: peso} }
   */
	constructor(config) {
		//console.log(config)
		this.nodesTable = new Map();

		for (let node in config) {

      // Crear una lista de adyacencia para cada nodo
			this.nodesTable.set(node, []);

      // Agregar a cada vecino a la casilla de su nodo previo en la tabla de adyacencia
			for (let neighborConfig of Object.entries(config[node].weights)) {
				const neighbor = neighborConfig[0];
				const nodeWeight = neighborConfig[1] ?? Infinity;

        let nodeRow = this.nodesTable.get(node);
				nodeRow.push({ node: neighbor, weight: nodeWeight });
			}
		}

		//console.log("Tabla de adyacencia: ", this.nodesTable);
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

			//console.log("NEIGHBORS: ", neighbors);

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


module.exports = {
  Graph,
}