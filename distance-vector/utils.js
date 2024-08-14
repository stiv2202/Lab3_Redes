const readline = require('readline');
const fs = require('fs');
const { CustomError } = require('./CustomError.js')
const { domainName } = require('./consts.js')

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
            rl.close();
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

module.exports = {
    readJsonFile,
    input,
    verifyName,
    initTable,
    getRandomNumber,
};
