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

const linkStateSend = async (message, topology = null) => {
  if (!topology) {
    const t = await readJsonFile('topo.json');
    topology = t.config;
  }

  const names = await readJsonFile('names.json');
  const startNode = getNode();
  const destinationNode = Object.keys(names.config).find(key => names.config[key] === message.to);

  if (!destinationNode) {
    console.log("El usuario destino no está en la topología.");
    return;
  }

  const linkState = new LinkState(topology);
  const path = linkState.getShortestPath(startNode, destinationNode);

  if (path.length > 1) {
    const nextNode = path[1];
    const nextNodeName = names.config[nextNode];
    sendMessage(names[startNode], nextNodeName, JSON.stringify(message));
  }
};

module.exports = {
  LinkState,
  linkStateSend
};