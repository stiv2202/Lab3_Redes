class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CustomError'; // Set the name of the error
    }
}

export default CustomError;
