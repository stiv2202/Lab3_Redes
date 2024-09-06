const readline = require('readline');
const fs = require('fs');
const { CustomError } = require('./CustomError.js')
const { domainName } = require('./consts.js');
const { sendEchoMessage } = require('./mediator.js')

const readJsonFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (parseErr) {
                    reject(parseErr);
                }
            }
        });
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const input = async (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

const verifyName = async (name) => {
    try {
        const data = await readJsonFile('names.json');
        let found = false;
        const config = Object.values(data.config);

        config.forEach(n => {
            if (`${name}@${domainName}` === n) found = true;
        });

        if (!found) {
            throw new CustomError("El nombre actual no pertenece a la topología indicada.");
        }

        return Object.keys(data.config).at(config.indexOf(`${name}@${domainName}`));

    } catch (error) {
        if (error instanceof CustomError) {
            console.log("Error: ", error.message);
        } else {
            console.log("Error verificando topología.", error);
        }
        return undefined;
    }
}

const getRandomNumber = (min, max, integer = false) => {
    let number = Math.random() * (max - min) + min;
    if (integer) number = Math.floor(number)
    return number
}

const infiniteTableDV = async (node, names) => {
    const vector = {}
    const data = await readJsonFile('topo.json');
    const config = data.config;
    const nodes = Object.keys(config)

    for (const n of nodes) {
        if (n === node) {
            vector[n] = 0;
        } else {
            vector[n] = Number.POSITIVE_INFINITY;
        }
    }

    const table = {
        [node]: vector
    }

    return table
}

const initTableDV = async (node, names) => {
    const vector = {}
    const data = await readJsonFile('topo.json');
    const config = data.config;
    const nodes = Object.keys(config)
    let neighbors = Object.values(config).at(Object.keys(config).indexOf(node))
    neighbors = neighbors.map(n => names[n])

    for (const n of nodes) {
        if (n === node) {
            vector[n] = 0;
        } else if (neighbors.includes(names[n])) {
            // vector[n] = getRandomNumber(1, 10, true)
            try {
                const echoTime = await sendEchoMessage(names[node], names[n]);
                vector[n] = echoTime;
            } catch (err) {
                console.error(`Error obteniendo distancia de ${names[n]}: ${err.message}`);
                vector[n] = Number.POSITIVE_INFINITY;
            }
        } else {
            vector[n] = Number.POSITIVE_INFINITY;
        }
    }

    const table = {
        [node]: vector
    }

    return [table, neighbors]
}

const initTable = async (node) => {
    const table = {}
    const data = await readJsonFile('topo.json');
    const config = data.config;
    const neighbors = Object.values(config).at(Object.keys(config).indexOf(node))

    neighbors.forEach(n => {
        table[n] = getRandomNumber(1, 10, true)
    });

    return [table, neighbors]
}

const decodeHtmlEntities = (str) => {
    return str.replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&apos;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/Infinity/g, 'null');
};

const isTableEmpty = (table) => {
    return Object.keys(table).length === 0;
}

module.exports = {
    readJsonFile,
    input,
    verifyName,
    initTable,
    getRandomNumber,
    decodeHtmlEntities,
    initTableDV,
    infiniteTableDV,
    isTableEmpty,
};
