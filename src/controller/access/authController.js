import { ObjectId } from 'mongodb';
import { Auth } from "../../model/access/auth.js";
import Util from "../../util/util.js"; // Importa Util, utilitario do sistema

class Controller {

    async find(id) {
        try {
            // Busca por ID
            const auth = await Auth.findOne({ _id: new ObjectId(id) });
            if (!auth) {
                const err = new Error("Não encontrado.");
                err.status = 404;
                throw err;
            }
            return auth;
        } catch (error) {
            if (error.status) throw error;
            const err = new Error("ID inválido.");
            err.status = 400;
            throw err;
        }
	}

    async all(page = 1, size = 10, search = '') {

        page = parseInt(page);
        size = parseInt(size);

        const skip = (page - 1) * size;

        const filter = search ? {
            $or: [
                { sub: { $regex: new RegExp(search, 'i') } },
                
            ]
        } : {};

        const auth = await Auth.find(filter).skip(skip).limit(size).toArray();

        const qyt = auth.length;
        const total = await Auth.countDocuments(filter);

        if (auth.length == 0 ) {
            const err = new Error("Não há auths registrados(a).");
            err.status = 404;
            throw err;
        }

        return {
			data: auth,
			total: total,
            quantity: qyt,
           	totalPages: Math.ceil(total / size)
		};

    }

	async create(sub, ip, userAgent, description) {

        const data = {
            sub: sub,
            ip: ip,
            description: description,
            userAgent: userAgent,
            createdAt: Util.currentDateTime('America/Sao_Paulo'),
            updatedAt: Util.currentDateTime('America/Sao_Paulo')
        };

		await Auth.insertOne(data);
		return data;
	}

    async update(authId, sub,ip, userAgent, description) {

        const updateData = {
            sub: sub,
            ip: ip,
            userAgent: userAgent,
            description: description
        };
        
        const fieldsToUpdate = Object.entries(updateData).reduce((acc, [key, value]) => {
            
            if (value !== undefined) {

                acc[key] = value;

            }

            return acc;
        }, {});

        if (Object.keys(fieldsToUpdate).length === 0) {
            console.log("Nenhum campo para atualizar foi fornecido.");
            return await this.find(authId); 
        }

        fieldsToUpdate.updatedAt = Util.currentDateTime('America/Sao_Paulo');

        const result = await Auth.updateOne(
            { _id: new ObjectId(authId) },
            { $set: fieldsToUpdate }
        );


        if (result.matchedCount === 0) {
            const err = new Error("Não encontrado.");
            err.status = 404;
            throw err;
        }

        return await this.find(authId);
    }

	async delete(authId) {
		// Deleta registro
		const result = await Auth.deleteOne({ _id: new ObjectId(authId) });
        if (result.deletedCount === 0) {
            const err = new Error("Não encontrado.");
            err.status = 404;
            throw err;
        }
        return { message: "Deletado com sucesso." };
	}

}

const authController = new Controller();
export { authController };
