// Archivo intermedio entre server y algoritmos, para evitar dependencias circulares.

let sendMessageFunc = null;

const setSendMessage = (func) => {
    sendMessageFunc = func;
};

const sendMessage = (from, to, body) => {
    if (sendMessageFunc) {
        sendMessageFunc(from, to, body);
    } else {
        console.error("sendMessage function is not set");
    }
};

let sendEchoMessageFunc = null;

const setSendEchoMessage = (func) => {
    sendEchoMessageFunc = func;
};

const sendEchoMessage = (from, to, body) => {
    if (sendEchoMessageFunc) {
        return sendEchoMessageFunc(from, to, body);
    } else {
        console.error("sendEchoMessage function is not set");
        return Promise.reject(new Error("sendEchoMessage function is not set"));
    }
};

module.exports = {
    setSendMessage,
    sendMessage,
    setSendEchoMessage,
    sendEchoMessage
};
