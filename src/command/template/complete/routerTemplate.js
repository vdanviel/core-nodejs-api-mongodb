
import express from "express";
import { __ModuleName__Controller } from "../controller/__ModuleName__Controller.js";

const __ModuleName__Router = express.Router();

// Buscar por ID
__ModuleName__Router.get('/:id', (req, res) => {
	__ModuleName__Controller.find(req.params.id)
		.then(result => {
			res.send(result);
		})
		.catch(error => {
			res.status(500).send({ error: error.message });
		});
});

// Criar novo registro
__ModuleName__Router.post('/register', (req, res) => {
	// Ajuste os campos conforme o model
	const { value1, value2, value3 } = req.body;
	__ModuleName__Controller.create(value1, value2, value3)
		.then(result => {
			res.send(result);
		})
		.catch(error => {
			res.status(500).send({ error: error.message });
		});
});

// Atualizar registro
__ModuleName__Router.put('/update/:id', (req, res) => {
	const { value1, value2, value3 } = req.body;
	__ModuleName__Controller.update(req.params.id, value1, value2, value3)
		.then(result => {
			res.send(result);
		})
		.catch(error => {
			res.status(500).send({ error: error.message });
		});
});

// Deletar registro
__ModuleName__Router.delete('/delete/:id', (req, res) => {
	__ModuleName__Controller.delete(req.params.id)
		.then(result => {
			res.send(result);
		})
		.catch(error => {
			res.status(500).send({ error: error.message });
		});
});

// Alternar status
__ModuleName__Router.patch('/toggle-status/:id', (req, res) => {
	__ModuleName__Controller.toggleStatus(req.params.id)
		.then(result => {
			res.send(result);
		})
		.catch(error => {
			res.status(500).send({ error: error.message });
		});
});

export { __ModuleName__Router };
