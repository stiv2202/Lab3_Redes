const { readJsonFile } = require('../utils.js');
const { sendMessage, sendEchoMessage } = require('../mediator.js');
const { getNode } = require('../enviroment.js');

class LinkState {
  constructor() {
    this.topology = {};
    this.distances = {};
    this.previous = {};
  }

  initialize(startNode) {
    this.topology[startNode] = {};
    this.distances[startNode] = 0;
  }

  updateTopology(fromNode, weights) {
    if (!this.topology[fromNode]) {
      this.topology[fromNode] = {};
    }

    for (let neighbor in weights) {
      this.topology[fromNode][neighbor] = weights[neighbor];
      if (!this.topology[neighbor]) {
        this.topology[neighbor] = {};
      }
      this.topology[neighbor][fromNode] = weights[neighbor];
    }
  }

  calculateShortestPaths(startNode) {
    this.initialize(startNode);
    let unvisited = new Set(Object.keys(this.topology));

    while (unvisited.size > 0) {
      let currentNode = this.getClosestNode(unvisited);
      unvisited.delete(currentNode);

      for (let neighbor in this.topology[currentNode]) {
        let alt = this.distances[currentNode] + this.topology[currentNode][neighbor];
        if (alt < this.distances[neighbor]) {
          this.distances[neighbor] = alt;
          this.previous[neighbor] = currentNode;
        }
      }
    }
  }

  getClosestNode(unvisited) {
    let minDistance = Infinity;
    let closestNode = null;

    for (let node of unvisited) {
      if (this.distances[node] < minDistance) {
        minDistance = this.distances[node];
        closestNode = node;
      }
    }

    return closestNode;
  }

  getShortestPath(startNode, endNode) {
    this.calculateShortestPaths(startNode);
    let path = [];
    let currentNode = endNode;

    while (currentNode) {
      path.unshift(currentNode);
      currentNode = this.previous[currentNode];
    }

    return path;
  }
}

/**
 * Calcular los pesos hacia los vecinos 
 * @param {string} currentNode Nodo actual.
 * @param {Object} topology Topología de la red.
 * @param {Object} names Mapa de nombres de nodos a direcciones XMPP.
 * @returns {Object} Pesos a los vecinos.
 */
const calculateNeighborWeights = async (currentNode, topology, names) => {
  let weights = {};
  
  const neighbors = topology[currentNode];

  if (!Array.isArray(neighbors) || neighbors.length === 0) {
    console.log(`No se encontraron vecinos para el nodo ${currentNode}`);
    return weights;
  }

  for (let neighbor of neighbors) {
    const neighborJID = names[neighbor]; 
    try {
      const time = await sendEchoMessage(names[currentNode], neighborJID); 
      weights[neighbor] = time; 
    } catch (error) {
      console.error(`Vecino ${neighborJID} no disponible.`);
    }
  }

  return weights;
};

/**
 * Difundir los pesos calculados a los vecinos.
 * @param {string} currentNode Nodo actual.
 * @param {Object} neighbors Pesos a los vecinos calculados mediante eco.
 * @param {Object} names Mapa de nombres de nodos a direcciones XMPP.
 */
const broadcastLinkState = async (currentNode, neighbors, names) => {
  for (let neighbor in neighbors) {
    const linkStateMessage = {
      type: "send_routing",
      from: names[currentNode],
      to: names[neighbor],
      weights: neighbors,
    };
    console.log(`Enviando estado de enlace a ${names[neighbor]}...`);
    sendMessage(names[currentNode], names[neighbor], JSON.stringify(linkStateMessage));
  }
};

/**
 * Enviar mensajes utilizando el algoritmo de Link State Routing.
 * @param {*} message Mensaje a enviar. Debe contener obligatoriamente el campo 'to'.
 */
const linkStateSend = async (message) => {
  const topology = (await readJsonFile('topo.json')).config;
  const names = (await readJsonFile('names.json')).config;
  const startNode = getNode();
  const destinationNode = Object.keys(names).find(key => names[key] === message.to);

  if (!destinationNode) {
    console.log("El usuario destino no está en la topología.");
    return;
  }

  let neighborsWeights = await calculateNeighborWeights(startNode, topology, names);

  await broadcastLinkState(startNode, neighborsWeights, names);

  const linkState = new LinkState();
  linkState.updateTopology(startNode, neighborsWeights);

  if (startNode === destinationNode) {
    console.log("El mensaje llegó a su destino!: ", message);

    const finalMessage = {
      type: "message",
      from: message.from,
      data: message.data,
    };
    sendMessage(names[startNode], names[destinationNode], JSON.stringify(finalMessage));
    return;
  }

  const path = linkState.getShortestPath(startNode, destinationNode);

  if (path.length > 1) {
    const nextNode = path[1];
    const nextNodeName = names[nextNode];
    const routingMessage = {
      type: "send_routing",
      to: names[destinationNode],
      from: names[startNode],
      data: message.data,
      hops: path.length,
    };
    console.log(`Enviando mensaje a siguiente nodo ${nextNodeName}...`);
    sendMessage(names[startNode], nextNodeName, JSON.stringify(routingMessage));
  }
};

module.exports = {
  LinkState,
  linkStateSend
};
