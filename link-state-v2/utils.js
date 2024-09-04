const readline = require('readline');
const fs = require('fs');
const { CustomError } = require('./CustomError.js')
const { domainName } = require('./consts.js');

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


const decodeHtmlEntities = (str) => {
    return str.replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
};

const getNeighbors = async (node) => {
    const topology = (await readJsonFile('topo_names.json')).config;
    return topology[node];
}

module.exports = {
    readJsonFile,
    input,
    verifyName,
    getRandomNumber,
    decodeHtmlEntities,
    getNeighbors
};
