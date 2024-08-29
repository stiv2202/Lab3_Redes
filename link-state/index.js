const { readJsonFile, verifyName } = require('../utils.js');
const { sendMessage } = require('../mediator.js');
const { getNode } = require('../enviroment.js');

class LinkState {
  constructor(topology) {
    this.topology = topology;
    this.distances = {};
    this.previous = {};
  }

  initialize(startNode) {
    for (let node in this.topology) {
      this.distances[node] = Infinity;
      this.previous[node] = null;
    }
    this.distances[startNode] = 0;
  }

  calculateShortestPaths(startNode) {
    this.initialize(startNode);
    let unvisited = new Set(Object.keys(this.topology));

    while (unvisited.size > 0) {
      let currentNode = this.getClosestNode(unvisited);
      unvisited.delete(currentNode);

      for (let neighbor of this.topology[currentNode]) {
        let alt = this.distances[currentNode] + 1; // Assuming all edges have weight 1
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
 * Enviar mensajes utilizando el algoritmo de Link State Routing.
 * Este método también maneja la difusión del estado del enlace a los vecinos.
 * @param {*} message Mensaje a enviar. Debe contener obligatoriamente el campo 'to'.
 * @param {*} topology La estructura de la topología debe ser { nodo: [vecinos] }
 */
const linkStateSend = async (message, topology = null) => {
  // Cargar topología por default
  if (!topology) {
    const t = await readJsonFile('topo.json');
    topology = t.config;
  }

  const names = await readJsonFile('names.json');
  const startNode = getNode();
  const destinationNode = Object.keys(names.config).find(key => names.config[key] === message.to);

  // Verificar si es el destinatario
  if (startNode === destinationNode) {
    console.log("El mensaje llegó a su destino!: ", message);
    return;
  }

  if (!destinationNode) {
    console.log("El usuario destino no está en la topología.");
    return;
  }

  // Difundir el estado del enlace a los vecinos
  await broadcastLinkState(startNode, topology, names);

  // Calcular la ruta más corta
  const linkState = new LinkState(topology);
  const path = linkState.getShortestPath(startNode, destinationNode);

  // Enviar el mensaje al siguiente nodo
  if (path.length > 1) {
    const nextNode = path[1];
    const nextNodeName = names.config[nextNode];
    console.log(`Enviando mensaje a siguiente nodo ${nextNodeName}...`);
    sendMessage(names.config[startNode], nextNodeName, JSON.stringify(message));
  }
};

/**
 * Difundir el estado del enlace actual a todos los vecinos.
 * @param {string} currentNode Nodo actual que está enviando su estado de enlace.
 * @param {Object} topology La topología de la red.
 * @param {Object} names Mapa de nombres de nodos a direcciones XMPP.
 */
const broadcastLinkState = async (currentNode, topology, names) => {
  const neighbors = topology[currentNode];

  for (let neighbor of neighbors) {
    const linkStateMessage = {
      type: "link-state",
      from: names.config[currentNode],
      to: names.config[neighbor],
      topology: topology,
    };
    console.log(`Enviando estado de enlace a ${names.config[neighbor]}...`);
    sendMessage(names.config[currentNode], names.config[neighbor], JSON.stringify(linkStateMessage));
  }
};

module.exports = {
  LinkState,
  linkStateSend
};
