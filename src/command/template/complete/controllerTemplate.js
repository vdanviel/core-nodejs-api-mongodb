import { ObjectId } from 'mongodb';
import { __TitleModuleName__ } from "../model/__ModuleName__.js";
import Util from "../util/util.js"; // Importa Util, utilitario do sistema

class Controller {
	async find(id) {
		// Busca por ID
		const __ModuleName__ = await __TitleModuleName__.findOne({ _id: new ObjectId(id) });
		if (!__ModuleName__) return { error: "Não encontrado." };
		return __ModuleName__;
	}

	async create(value1, value2, value3) {

        const data = {
            value_1: value1,
            value_2: value2,
            value_3: value3,
            status: true,
            createdAt: Util.currentDateTime('America/Sao_Paulo'),
            updatedAt: Util.currentDateTime('America/Sao_Paulo')
        };

        //restante dos dados...

		await __TitleModuleName__.insertOne(data);
		return data;
	}

	async update(__ModuleName__Id, value1, value2, value3) {
		// Atualiza registro
		data.updatedAt = new Date();
		const result = await __TitleModuleName__.updateOne(
			{ _id: new ObjectId(__ModuleName__Id) },
			{ $set: {
                value_1: value1,
                value_2: value2,
                value_3: value3,
                updatedAt: Util.currentDateTime('America/Sao_Paulo')
            } }
		);
		if (result.matchedCount === 0) return { error: "Não encontrado." };
		return await this.find(id);
	}

	async delete(__ModuleName__Id) {
		// Deleta registro
		const result = await __TitleModuleName__.deleteOne({ _id: new ObjectId(__ModuleName__Id) });
		if (result.deletedCount === 0) return { error: "Não encontrado." };
		return { message: "Deletado com sucesso." };
	}

	async toggleStatus(__ModuleName__Id) {
		// Alterna status booleano
		const __ModuleName__ = await __TitleModuleName__.findOne({ _id: new ObjectId(__ModuleName__Id) });
		if (!__ModuleName__) return { error: "Não encontrado." };

		const newStatus = !__ModuleName__.status;

		await __TitleModuleName__.updateOne(
			{ _id: new ObjectId(__ModuleName__Id) },
			{ $set: { status: newStatus, updatedAt: Util.currentDateTime('America/Sao_Paulo') } }
		);
		return { message: `Status ${newStatus ? 'ativado' : 'desativado'} com sucesso.` };
	}
}

const __ModuleName__Controller = new Controller();
export { __ModuleName__Controller };
