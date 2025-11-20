import express from "express";
import { isAuth } from "../middleware/auth.js";
import { checkScope } from "../middleware/scope.js";
import { body, validationResult, param } from "express-validator";
import { CustomerController } from "../controller/customerController.js";

const customerRouter = express.Router();

customerRouter.get('/me', isAuth, checkScope("read:customer"), (req, res) => {
    
    CustomerController.find(req.auth.data.sub)// acessando o objeto auth no JWT para pegar o id do auth, o metodo do controller vai pegar esse id e partir dele achar o id do customer...
    .then(customer => {
        return res.send(customer);
    })
    .catch(error => {
        return res.status(error.status || 500).send({ 
            error: error.message
        });
    });

});

customerRouter.post('/register', [
        body('name').exists().withMessage("Nome é obrigatório.").notEmpty().withMessage("Preencha o nome."),
        body('email').exists().withMessage("Email é obrigatório.").isEmail().withMessage("Email Inválido.").notEmpty().withMessage("Preencha o email."),
        body('phone').exists().withMessage("Celular é obrigatório.").isMobilePhone('pt-BR').withMessage("Número celular inválido.").notEmpty().withMessage("Preencha o celular."),
        body('password').exists().withMessage("Senha é obrigatória.").notEmpty().withMessage("Preencha a senha."),
    ], (req, res) => {
    
        const validate = validationResult(req);

        if (validate.isEmpty() == false) {
            return res.send({
                missing: validate.array()
            });
        }
        
        CustomerController.register(req.body.name, req.body.email, req.body.password,req.body.phone)
        .then(register => {
            return res.send(register);
        })
        .catch(error => {
            return res.status(error.status || 500).send({ 
                error: error.message
            });
        });

});

customerRouter.post('/login', [
        body('email').exists().withMessage("Email é obrigatório.").isEmail().withMessage("Email Inválido.").notEmpty().withMessage("Preencha o email."),
        body('password').exists().withMessage("Senha é obrigatória.").notEmpty().withMessage("Preencha a senha.")
    ], (req, res) => {
        
        const validate = validationResult(req);

        if (validate.isEmpty() == false) {
            return res.send({missing: validate.array()});
        }

        CustomerController.login(req.body.email, req.body.password, req.ip, req.get('user-agent') )
        .then(login => {       
            return res.send(login);
        }).catch(error => {
            return res.status(error.status || 500).send({ 
            error: error.message
            });
        });

});

customerRouter.put('/update', [
    body('name').exists().withMessage("Nome é obrigatório.").notEmpty().withMessage("Preencha o nome."),
    body('phone').exists().withMessage("Celular é obrigatório.").isMobilePhone('pt-BR').withMessage("Número celular inválido.").notEmpty().withMessage("Preencha o celular."),
], isAuth, checkScope("update:customer"), (req, res) => {

        const validate = validationResult(req);

        if (validate.isEmpty() == false) {
            return res.send({
                missing: validate.array()
            });
        }

        CustomerController.update(req.auth.data.sub, req.body.name, req.body.phone)
        .then(customer => {
            return res.send(customer);
        }).catch(error => {
            return res.status(error.status || 500).send({ 
                error: error.message
            });
        });

});

// customerRouter.delete('/delete/:id', [
//         param('id').exists().withMessage("O ID do usuário é obrigatório.").notEmpty().withMessage("Preencha o ID do usuário.")
//     ], isAuth, (req, res) => {

//         CustomerController.delete(req.params.id)
//         .then(customer => {
//             return res.send(customer);
//         }).catch(error => {
//             return res.status(error.status || 500).send({ 
//                 error: error.message,
//  //             });
//         });

// });

// Envia código para mudança de email
customerRouter.post('/change-email/mail', [
    body('new_email').exists().withMessage("Novo email é obrigatório.").isEmail().withMessage("Email inválido.").notEmpty().withMessage("Preencha o novo email."),
], isAuth, checkScope("update:customer"), (req, res) => {
    const validate = validationResult(req);

    if (!validate.isEmpty()) {
        return res.send({ missing: validate.array() });
    }

    CustomerController.sendChangeEmailCode(req.auth.data.sub, req.body.new_email)
    .then(result => {return res.send(result)})
    .catch(error => {return res.status(error.status || 500).send({ error: error.message })});
});

// Altera o email do usuário após validação
customerRouter.patch('/change-email', [
    body('code').exists().withMessage("Código é obrigatório.").notEmpty().withMessage("Preencha o código."),
    body('secret').exists().withMessage("Secret é obrigatório.").notEmpty().withMessage("Preencha o secret."),
    body('new_email').exists().withMessage("Novo email é obrigatório.").isEmail().withMessage("Email inválido.").notEmpty().withMessage("Preencha o novo email."),
], isAuth,checkScope("update:customer"), (req, res) => {
    const validate = validationResult(req);

    if (!validate.isEmpty()) {
        return res.send({ missing: validate.array() });
    }

    CustomerController.changeEmail(req.auth.data.sub, req.body.new_email, req.body.code, req.body.secret)
    .then(result => {return res.send(result)})
    .catch(error => {return res.status(error.status || 500).send({ error: error.message })});
});

//envia email de recuperação de senha
customerRouter.post('/forgot-password/mail', [
    body('email').exists().withMessage("Email é obrigatório.").notEmpty().withMessage("Preencha o email."),
], (req, res) => {

    const validate = validationResult(req);

    if (validate.isEmpty() == false) {
        return res.send({
            missing: validate.array()
        });
    }

    CustomerController.sendForgotPasswordCode(req.body.email).then((result) => {

        return res.send(result);

    }).catch(error => {
        return res.status(error.status || 500).send({ 
            error: error.message
        });
    });

});

//atualiza a  senha do usuário usando o codigo
customerRouter.patch('/update-password/', [
        body('code').exists().withMessage("Code field is missed.").notEmpty().withMessage("Fill security code field."),
        body('old_password').exists().withMessage("Senha antiga é obrigatória.").notEmpty().withMessage("Preencha a senha antiga."),
        body('new_password').exists().withMessage("Nova senha é obrigatória.").notEmpty().withMessage("Preencha a nova senha."),
        body('secret').exists().withMessage("Nova senha é obrigatória.").notEmpty().withMessage("Preencha a nova senha.")
    ], (req, res) => {

        const validate = validationResult(req);

        if (validate.isEmpty() == false) {
            return res.send({
                missing: validate.array()
            });
        }

        CustomerController.changePassword(req.body.old_password, req.body.new_password, req.body.code, req.body.secret)
        .then(customer => {
            return res.send(customer);
        }).catch(error => {
            return res.status(error.status || 500).send({ 
                error: error.message,
            });
        });

});

//acha o usuário pelo id dele
customerRouter.get('/:id', [
    param('id').exists().withMessage("O id do usuário é obrigatório.").notEmpty().withMessage("Preencha o id do usuário.")
], (req, res) => {

    const validate = validationResult(req);

    if (validate.isEmpty() == false) {
        return res.send({
            missing: validate.array()
        });
    }

    CustomerController.find(req.params.id).then((customer) => {
        res.send(customer);
    }).catch(error => {
        return res.status(error.status || 500).send({ 
            error: error.message
        });
    });

});

//ativa/desativa usuario
customerRouter.patch('/toogle-status', isAuth, checkScope("update:customer"), (req, res) => {
    const validate = validationResult(req);

    if (!validate.isEmpty()) {
        return res.status(400).send({
            missing: validate.array()
        });
    }

    CustomerController.toggleStatus(req.auth.data.sub)
    .then(result => {
        return res.send(result);
    }).catch(error => {
        return res.status(error.status || 500).send({ 
            error: error.message
        });
    });
});

export {customerRouter};