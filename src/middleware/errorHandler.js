import Util from "../util/util.js"; // ajuste o path

export const errorHandler = (error, req, res, next) => {
	Util.logInFile(`Erro em ${req.method} ${req.originalUrl}: ${error.stack}`);

	res.status(error.status || 500).send({ error: error.stack });
};