import { Customer } from "../model/customer.js";
import Util from "../util/util.js";
import { sender as mailSender } from "../mail/sender.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';
import { PersonalAccessTokenController } from "./personalAccessTokenController.js";
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

class Controller {

    async find(customerId){
        try {
            const foundCustomer = await Customer.findOne({ _id: new ObjectId(customerId) });
            
            if (!foundCustomer) {
                return { error: "Não há usuário." };
            }
            
            // Remove a senha do objeto retornado
            const { password, ...customerWithoutPassword } = foundCustomer;
            return customerWithoutPassword;
            
        } catch (error) {
            return { error: "ID inválido." };
        }
    }

    async register(name, email, password, phone, token = null){
        // Verifica se email já existe
        if (email) {
            const existingCustomer = await Customer.findOne({ email });
            if (existingCustomer) {
                return { error: "Usuário já existe." };
            }
        }

        // Cria hash da senha
        let hash = null;
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            hash = bcrypt.hashSync(password, salt);
        }

        const customerToken = token ?? uuidv4();
        const newCustomer = {
            name: name || null,
            email: email || null,
            phone: phone,
            password: hash,
            token: customerToken,
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

        // Remove password e token antes de retornar
        delete newCustomer.password;
        delete newCustomer.token;
        
        return newCustomer;
    }

    async findCustomerByToken(customerToken){
        const foundCustomer = await Customer.findOne({ token: customerToken });
        
        if (!foundCustomer) {
            return { error: "Não há usuário." };
        }
        
        const { password, ...customerWithoutPassword } = foundCustomer;
        return customerWithoutPassword;
    }

    async login(email, password){
        const foundCustomer = await Customer.findOne({ email });
        
        if (!foundCustomer) {
            return { error: "Usuário não existe." };
        }
        
        if (!bcrypt.compareSync(password, foundCustomer.password)) {
            return { error: "A senha é inválida." };
        }

        // Cria JWT sem o password
        const { password: _, ...customerWithoutPassword } = foundCustomer;//retirar a seha do obj

        const encodedJwt = jwt.sign({
            data: customerWithoutPassword,
            scope: ["read:customer", "read:barber"]
        }, process.env.JWT_SECRET, { expiresIn: '336h' });

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
                return { error: "Usuário não existe." };
            }

            return await this.find(customerId);
        } catch (error) {
            return { error: "ID inválido." };
        }
    }

    async delete(customerId){
        try {
            const result = await Customer.deleteOne({ _id: new ObjectId(customerId) });
            
            if (result.deletedCount === 0) {
                return { error: "Usuário não existe." };
            }

            return { message: "Usuário deletado com sucesso." };
        } catch (error) {
            return { error: "ID inválido." };
        }
    }

    async findByEmail(customerEmail){
        const foundCustomer = await Customer.findOne({ email: customerEmail });
        
        if (!foundCustomer) {
            return { error: "Não há usuário." };
        }
        
        const { password, ...customerWithoutPassword } = foundCustomer;
        return customerWithoutPassword;
    }

    async toggleStatus(customerId) {
        try {
            const customer = await Customer.findOne({ _id: new ObjectId(customerId) });
            
            if (!customer) {
                return { error: "Usuário não encontrado." };
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
            return { error: "ID inválido." };
        }
    }

    //enviar email com código para recuperação de senha
    async sendForgotPasswordCode(email) {
        const customer = await Customer.findOne({ email });
        
        if (!customer) {
            return { error: "Usuário não existe." };
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
            throw new Error('Falha ao enviar email de redefinição de senha');
        }

        return { message: "O código de redefinição de senha foi enviado ao e-mail com sucesso." };
    }

    async changePassword(oldPassword, newPassword, code, secret) {

        const personalAT = await PersonalAccessTokenController.verifyByCode(code);        

        if(personalAT.error){
            return personalAT;
        }

        //se o secret for diferente não pode mudar
        if (personalAT.secret !== secret) {
            return {
                error: "Falha na validação de segurança. (SCRT)"
            }
        }

        const customer = await Customer.findOne({ _id: new ObjectId(personalAT.tokenable_id) });        

        if(customer == null){
            return {
                "error": "Usuário não existe."
            };
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
            return {
                "error": "A senha antiga é inválida."
            };
        }

    }

    // envia email com código para mudança de email
    async sendChangeEmailCode(customerId, newEmail) {
        const customer = await Customer.findOne({ _id: new ObjectId(customerId) });

        if (!customer) {
            return { error: "Usuário não existe." };
        }

        // Verifica se o novo email já está em uso
        const emailExists = await Customer.findOne({ email: newEmail });
        if (emailExists) {
            return { error: "Este email já está em uso." };
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
            throw new Error('Falha ao enviar email de confirmação de mudança');
        }

        return { message: "O código de confirmação foi enviado ao novo e-mail com sucesso." };
    }

    // altera o email do usuário após validação
    async changeEmail(currentCustomerId ,email, code, secret) {

        const personalAT = await PersonalAccessTokenController.verifyByCode(code);

        if (personalAT.error) {
            return personalAT;
        }

        if (personalAT.secret !== secret) {
            return { error: "Falha na validação de segurança. (SCRT)" };
        }

        const customer = await Customer.findOne({ _id: new ObjectId(personalAT.tokenable_id) });

        if (!customer) {
            return { error: "Usuário não existe." };
        }
        console.log(customer._id, currentCustomerId);
        
        if (customer._id != currentCustomerId) {
            return { error: "Identity not confirmed." };
        }

        const newEmail = email;

        // Verifica se o novo email já está em uso
        const emailExists = await Customer.findOne({ email: newEmail });
        if (emailExists) {
            return { error: "Este email já está em uso." };
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