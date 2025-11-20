import { Customer } from "../model/customer.js";
import { PersonalAccessTokenController } from "./access/personalAccessTokenController.js";
import { authController } from "./access/authController.js";
import { roleController } from "./access/roleController.js";

import Util from "../util/util.js";
import { sender as mailSender } from "../mail/sender.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

class Controller {

    async find(customerId){
        try {
            const foundCustomer = await Customer.findOne({ _id: new ObjectId(customerId) });
            
            if (!foundCustomer) {
                const err = new Error("Não há usuário.");
                err.status = 404;
                throw err;
            }
            
            // Remove a senha do objeto retornado
            const { password, ...customerWithoutPassword } = foundCustomer;
            return customerWithoutPassword;
            
        } catch (error) {
            if (error.status) throw error;
            const err = new Error("ID inválido.");
            err.status = 400;
            throw err;
        }
    }

    async register(name, email, password, phone){
        // Verifica se email já existe
        if (email) {
            const existingCustomer = await Customer.findOne({ email });
            if (existingCustomer) {
                const err = new Error("Usuário já existe.");
                err.status = 409;
                throw err;
            }
        }

        // Cria hash da senha
        let hash = null;
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            hash = bcrypt.hashSync(password, salt);
        }

        const newCustomer = {
            name: name || null,
            email: email || null,
            phone: phone,
            password: hash,
            status: true,
            createdAt: Util.currentDateTime('America/Sao_Paulo'),
            updatedAt: Util.currentDateTime('America/Sao_Paulo')
        };

        await Customer.insertOne(newCustomer);

        // Envia email de boas vindas se foi fornecido email
        if (email) {
            try {
                await mailSender.sendUserWelcomeEmail(email, name);
            } catch (error) {
                console.error('Erro ao enviar email de boas-vindas:', error);
                // Não falha a criação do usuário se o email falhar
            }
        }

        // Remove password antes de retornar
        delete newCustomer.password;
        
        return newCustomer;
    }

    async login(email, password, ip, userAgent){
        const foundCustomer = await Customer.findOne({ email });
        
        if (!foundCustomer) {
            const err = new Error("Usuário não existe.");
            err.status = 401;
            throw err;
        }
        
        if (!bcrypt.compareSync(password, foundCustomer.password)) {
            const err = new Error("A senha é inválida.");
            err.status = 401;
            throw err;
        }

        // Cria JWT sem o password
        const { password: _, ...customerWithoutPassword } = foundCustomer;//retirar a seha do obj

        //gerando o auth ataul..
        const currentAuth = await authController.create(
            customerWithoutPassword._id,
            ip,
            userAgent,
            "login"
        )

        //achar as roles associada ao tipo de usuário (customer) que no caso é "customer-role"
        const role = await roleController.find("customer-role");

        //verificar se vai encontrar o o segredo JWT...
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            const err = new Error("JWT secret is not configured.");
            err.status = 500;
            throw err;
        }

        //aqui ele vai criar o objeto "data" a partir do auth ou seja quem será armazenado e acessado em customerRouter é o própio objeto auth
        const encodedJwt = jwt.sign(
        {
            data: currentAuth,
            scope: Array.isArray(role && role.permissions) ? role.permissions : []
        }
        ,secret, { expiresIn: '168h' });

        return { access_token: encodedJwt };
    }

    async update(customerId, name, phone){
        try {
            const result = await Customer.updateOne(
                { _id: new ObjectId(customerId) },
                { 
                    $set: { 
                        name,
                        phone,
                        updatedAt: Util.currentDateTime('America/Sao_Paulo')
                    }
                }
            );

            if (result.matchedCount === 0) {
                const err = new Error("Usuário não existe.");
                err.status = 404;
                throw err;
            }

            return await this.find(customerId);
        } catch (error) {
            if (error.status) throw error;
            const err = new Error("ID inválido.");
            err.status = 400;
            throw err;
        }
    }

    // async delete(customerId){
    //     try {
    //         const result = await Customer.deleteOne({ _id: new ObjectId(customerId) });
            
    //         if (result.deletedCount === 0) {
    //             return { error: "Usuário não existe." };
    //         }

    //         return { message: "Usuário deletado com sucesso." };
    //     } catch (error) {
    //         return { error: "ID inválido." };
    //     }
    // }

    async findByEmail(customerEmail){
        const foundCustomer = await Customer.findOne({ email: customerEmail });
        
        if (!foundCustomer) {
            const err = new Error("Não há usuário.");
            err.status = 404;
            throw err;
        }
        
        const { password, ...customerWithoutPassword } = foundCustomer;
        return customerWithoutPassword;
    }

    async toggleStatus(customerId) {
        try {
            const customer = await Customer.findOne({ _id: new ObjectId(customerId) });
            
            if (!customer) {
                const err = new Error("Usuário não encontrado.");
                err.status = 404;
                throw err;
            }

            const newStatus = !customer.status;

            await Customer.updateOne(
                { _id: new ObjectId(customerId) },
                { 
                    $set: { 
                        status: newStatus,
                        updatedAt: Util.currentDateTime('America/Sao_Paulo')
                    }
                }
            );

            return { message: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.` };
        } catch (error) {
            if (error.status) throw error;
            const err = new Error("ID inválido.");
            err.status = 400;
            throw err;
        }
    }

    //enviar email com código para recuperação de senha
    async sendForgotPasswordCode(email) {
        const customer = await Customer.findOne({ email });
        
        if (!customer) {
            const err = new Error("Usuário não existe.");
            err.status = 404;
            throw err;
        }

        const generatedCode = Util.generateCode(5);
        const secretWord = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hr

        await PersonalAccessTokenController.register(
            "forgot_password", 
            customer._id, 
            customer.name, 
            secretWord, 
            generatedCode, 
            null, 
            Date.now(), 
            expiresAt
        );

        try {
            await mailSender.sendPasswordResetEmail(customer.email, customer.name, generatedCode);
        } catch (error) {
            console.error('Erro ao enviar email de redefinição de senha:', error);
            const err = new Error('Falha ao enviar email de redefinição de senha');
            err.status = 500;
            throw err;
        }

        return { message: "O código de redefinição de senha foi enviado ao e-mail com sucesso." };
    }

    async changePassword(oldPassword, newPassword, code, secret) {

        const personalAT = await PersonalAccessTokenController.verifyByCode(code);        

        if(personalAT.error){
            const err = new Error(personalAT.error);
            err.status = 400;
            throw err;
        }

        //se o secret for diferente não pode mudar
        if (personalAT.secret !== secret) {
            const err = new Error("Falha na validação de segurança. (SCRT)");
            err.status = 403;
            throw err;
        }

        const customer = await Customer.findOne({ _id: new ObjectId(personalAT.tokenable_id) });        

        if(customer == null){
            const err = new Error("Usuário não existe.");
            err.status = 404;
            throw err;
        }

        if(bcrypt.compareSync(oldPassword, customer.password) == true){

            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(newPassword, salt);

            await Customer.updateOne({ _id: new ObjectId(customer._id)},{ $set: {password: hash} });

            //deletar codigo de recuperação antes de retornar para usuario..
            await PersonalAccessTokenController.deleteAllRelated(customer._id);

            return {
                message: "Senha alterada com sucesso."
            };

        }else{
            const err = new Error("A senha antiga é inválida.");
            err.status = 401;
            throw err;
        }

    }

    // envia email com código para mudança de email
    async sendChangeEmailCode(customerId, newEmail) {
        const customer = await Customer.findOne({ _id: new ObjectId(customerId) });

        if (!customer) {
            const err = new Error("Usuário não existe.");
            err.status = 404;
            throw err;
        }

        // Verifica se o novo email já está em uso
        const emailExists = await Customer.findOne({ email: newEmail });
        if (emailExists) {
            const err = new Error("Este email já está em uso.");
            err.status = 409;
            throw err;
        }

        const generatedCode = Util.generateCode(5);
        const secretWord = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hr

        await PersonalAccessTokenController.register(
            "change_email",
            customer._id,
            newEmail,
            secretWord,
            generatedCode,
            null,
            Date.now(),
            expiresAt
        );

        try {
            await mailSender.sendEmailChangeConfirmation(newEmail, customer.name, generatedCode, secretWord);
        } catch (error) {
            console.error('Erro ao enviar email de confirmação de mudança:', error);
            const err = new Error('Falha ao enviar email de confirmação de mudança');
            err.status = 500;
            throw err;
        }

        return { message: "O código de confirmação foi enviado ao novo e-mail com sucesso." };
    }

    // altera o email do usuário após validação
    async changeEmail(currentCustomerId ,email, code, secret) {

        const personalAT = await PersonalAccessTokenController.verifyByCode(code);

        if (personalAT.error) {
            const err = new Error(personalAT.error);
            err.status = 400;
            throw err;
        }

        if (personalAT.secret !== secret) {
            const err = new Error("Falha na validação de segurança. (SCRT)");
            err.status = 403;
            throw err;
        }

        const customer = await Customer.findOne({ _id: new ObjectId(personalAT.tokenable_id) });

        if (!customer) {
            const err = new Error("Usuário não existe.");
            err.status = 404;
            throw err;
        }
        console.log(customer._id, currentCustomerId);
        
        if (customer._id != currentCustomerId) {
            const err = new Error("Identity not confirmed.");
            err.status = 403;
            throw err;
        }

        const newEmail = email;

        // Verifica se o novo email já está em uso
        const emailExists = await Customer.findOne({ email: newEmail });
        if (emailExists) {
            const err = new Error("Este email já está em uso.");
            err.status = 409;
            throw err;
        }

        await Customer.updateOne(
            { _id: new ObjectId(personalAT.tokenable_id) },
            { $set: { email: newEmail, updatedAt: Util.currentDateTime('America/Sao_Paulo') } }
        );

        await PersonalAccessTokenController.deleteAllRelated(customer._id);

        return { message: "Email alterado com sucesso." };
    }


}

const CustomerController = new Controller();
export { CustomerController };