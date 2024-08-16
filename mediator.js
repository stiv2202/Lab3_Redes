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

module.exports = {
    setSendMessage,
    sendMessage
};
