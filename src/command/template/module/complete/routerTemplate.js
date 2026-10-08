
import express from "express";
import { __TitleModuleName__Controller } from "../controller/__TitleModuleName__Controller.js";
import { query, body, validationResult } from "express-validator";

const __TitleModuleName__Router = express.Router();

const validateData = [
	body('value1').exists().withMessage('O value1 é obrigatório'),
	body('value2').exists().withMessage('O value2 é obrigatório'),
	body('value3').exists().withMessage('O value3 é obrigatório')	
];

const validateDataUpdated = [
	body('value1').optional().exists().withMessage('O value1 é obrigatório'),
	body('value2').optional().exists().withMessage('O value2 é obrigatório'),
	body('value3').optional().exists().withMessage('O value3 é obrigatório')	
];

// Buscar por ID
__TitleModuleName__Router.get('/:id', (req, res) => {
	__TitleModuleName__Controller.find(req.params.id)
		.then(result => {
			res.send(result);
		});
});

// Buscar todos paginado
__TitleModuleName__Router.get('/', [
	query('page').optional().exists().withMessage('O page precisa estar presente.'),
	query('size').optional().exists().withMessage('O size precisa estar presente.'),
	query('search').optional().exists().withMessage('O search precisa estar presente.'),
	query('startDate').optional().isISO8601().toDate().withMessage('O startDate deve ser uma data válida no formato ISO8601.'),
	query('endDate').optional().isISO8601().toDate().withMessage('O endDate deve ser uma data válida no formato ISO8601.')
], (req, res) => {
	__TitleModuleName__Controller.all(req.query.page, req.query.size, req.query.search, req.query.startDate, req.query.endDate)
		.then(result => {
			res.send(result);
		});
});

// Criar novo registro
__TitleModuleName__Router.post('/register', validateData, (req, res) => {

	// Validação dos dados recebidos
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(500).json({ errors: errors.array() });
	}

	const { value1, value2, value3 } = req.body;
	__TitleModuleName__Controller.create(value1, value2, value3)
		.then(result => {
			res.send(result);
		});
});

// Atualizar registro
__TitleModuleName__Router.put('/update/:id', validateDataUpdated, (req, res) => {

	// Validação dos dados recebidos
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(500).json({ errors: errors.array() });
	}

	const { value1, value2, value3 } = req.body;
	__TitleModuleName__Controller.update(req.params.id, value1, value2, value3)
		.then(result => {
			res.send(result);
		});
});

// Deletar registro
__TitleModuleName__Router.delete('/delete/:id', (req, res) => {
	__TitleModuleName__Controller.delete(req.params.id)
		.then(result => {
			res.send(result);
		});
});

// Alternar status
__TitleModuleName__Router.patch('/:id/status', (req, res) => {
	__TitleModuleName__Controller.toggleStatus(req.params.id)
		.then(result => {
			res.send(result);
		});
});

export { __TitleModuleName__Router };
