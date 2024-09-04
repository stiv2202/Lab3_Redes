const weightsTable = {};

/**
 * weights debe venir como {user: weight, ...}
 * @param {*} user 
 * @param {*} weights 
 * @returns version number
 */
const modifyNodeWeights = (user, weights) => {

  const version = weightsTable[user] ? weightsTable[user].version + 1 : 1;

  weightsTable[user] = {
    weights,
    version,
  };
  //console.log(weightsTable)
  return version;
}

const getNodeWeights = (user) => {
  return weightsTable[user];
}

const getWeightsTable = () => {
  return weightsTable;
}

module.exports = {
  modifyNodeWeights,
  getNodeWeights,
  getWeightsTable,
}