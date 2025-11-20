import { ObjectId } from 'mongodb';
import { Role } from "../../model/access/role.js";
import Util from "../../util/util.js"; // Importa Util, utilitario do sistema

class Controller {

	async find(name) {
		// Busca por ID
        const role = await Role.findOne({ name: name });
        if (!role) {
            const err = new Error("Não encontrado.");
            err.status = 404;
            throw err;
        }
        return role;
	}

    async all(page = 1, size = 10, search = '') {

        page = parseInt(page);
        size = parseInt(size);

        const skip = (page - 1) * size;

        const filter = search ? {
            $or: [
                { name: { $regex: new RegExp(search, 'i') } },
                { permissions: { $regex: new RegExp(search, 'i') } },
                { description: { $regex: new RegExp(search, 'i') } }
            ]
        } : {};

        const role = await Role.find(filter).skip(skip).limit(size).toArray();

        const qyt = role.length;
        const total = await Role.countDocuments(filter);

        if (role.length == 0 ) {
            const err = new Error("Não há roles registrados(a).");
            err.status = 404;
            throw err;
        }

        return {
			data: role,
			total: total,
            quantity: qyt,
           	totalPages: Math.ceil(total / size)
		};

    }

	async create(name, permissions, description) {
        
        permissions = Array.isArray(permissions) ? Array.toString(permissions) : permissions;

        const data = {
            name: name,
            permissions: permissions,
            description: description,
            status: true,
            createdAt: Util.currentDateTime('America/Sao_Paulo'),
            updatedAt: Util.currentDateTime('America/Sao_Paulo')
        };

        //restante dos dados...
		await Role.insertOne(data);
		return data;
	}

    async update(roleId, name, permissions, description) {

        // Dados que podem ser atualizados
        const updateData = {
            name: name,
            permissions: permissions,
            description: description
        };
        
        const fieldsToUpdate = Object.entries(updateData).reduce((acc, [key, value]) => {

            if (value !== undefined) {
                
                if (key === 'permissions' && Array.isArray(value)) {
                    acc[key] = Array.toString(value);
                } else {
                    acc[key] = value;
                }
                
            }

            return acc;
        }, {});

        if (Object.keys(fieldsToUpdate).length === 0) {
            return await this.find(roleId); 
        }

        fieldsToUpdate.updatedAt = Util.currentDateTime('America/Sao_Paulo');

        const result = await Role.updateOne(
            { _id: new ObjectId(roleId) },
            { $set: fieldsToUpdate }
        );

        if (result.matchedCount === 0) {
            const err = new Error("Não encontrado.");
            err.status = 404;
            throw err;
        }

        return await Role.find(roleId);
    }

	async delete(roleId) {
		// Deleta registro
		const result = await Role.deleteOne({ _id: new ObjectId(roleId) });
        if (result.deletedCount === 0) {
            const err = new Error("Não encontrado.");
            err.status = 404;
            throw err;
        }
        return { message: "Deletado com sucesso." };
	}

	async toggleStatus(roleId) {
		// Alterna status booleano
		const role = await Role.findOne({ _id: new ObjectId(roleId) });
        if (!role) {
            const err = new Error("Não encontrado.");
            err.status = 404;
            throw err;
        }

		const newStatus = !role.status;

		await Role.updateOne(
			{ _id: new ObjectId(roleId) },
			{ $set: { status: newStatus, updatedAt: Util.currentDateTime('America/Sao_Paulo') } }
		);
		return { message: `Status ${newStatus ? 'ativado' : 'desativado'} com sucesso.` };
	}
}

const roleController = new Controller();
export { roleController };
