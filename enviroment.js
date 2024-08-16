let TABLE = {};
let NODE = undefined;

const updateTable = (newTable) => {
    TABLE = newTable;
};

const updateNode = (newNode) => {
    NODE = newNode;
};

const getNode = () => NODE;
const getTable = () => TABLE;

module.exports = { updateTable, updateNode, getNode, getTable };
