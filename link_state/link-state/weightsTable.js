const { getNode } = require("../utils");

const weightsTable = {};

/**
 * weights debe venir como {user: weight, ...}
 * @param {*} user 
 * @param {*} weights 
 * @returns version number
 */
const modifyNodeWeights = async (user, weights) => {

  const node = await getNode(user);

  const version = weightsTable[node] ? weightsTable[node].version + 1 : 1;

  weightsTable[node] = {
    weights,
    version,
  };
  console.log(weightsTable)
  return version;
}

const getNodeWeights = async (user) => {
  const node = await getNode(user);

  return weightsTable[node];
}

const getWeightsTable = () => {
  return weightsTable;
}

module.exports = {
  modifyNodeWeights,
  getNodeWeights,
  getWeightsTable,
}