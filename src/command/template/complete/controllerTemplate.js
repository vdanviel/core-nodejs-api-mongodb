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

    async all(page = 1, size = 10, search = '') {

        page = parseInt(page);
        size = parseInt(size);

        const skip = (page - 1) * size;

        const filter = search ? {
            $or: [
                { value_1: { $regex: new RegExp(search, 'i') } },
                { value_2: { $regex: new RegExp(search, 'i') } },
                { value_3: { $regex: new RegExp(search, 'i') } }
            ]
        } : {};

        const __ModuleName__ = await __TitleModuleName__.find(filter).skip(skip).limit(size).toArray();

        const qyt = __ModuleName__.length;
        const total = await __TitleModuleName__.countDocuments(filter);

		if (__ModuleName__.length == 0 ) return { error: "Não há __ModuleName__s registrados(a)." };

		return {
			data: __ModuleName__,
			total: total,
            quantity: qyt,
           	totalPages: Math.ceil(total / size)
		};

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
        
		await __TitleModuleName__.insertOne(data);
		return data;
	}

    async update(__ModuleName__Id, value1, value2, value3) {

        // Dados que podem ser atualizados
        const updateData = {
            value_1: value1,
            value_2: value2,
            value_3: value3
            // Adicione outros campos que podem ser atualizados aqui...
        };
        
        // 1. Constrói dinamicamente o objeto $set, processando apenas os valores definidos.
        const fieldsToUpdate = Object.entries(updateData).reduce((acc, [key, value]) => {
            // Ignora qualquer chave cujo valor seja estritamente undefined, ou seja, não está sendo atualizada.
            // Permite que campos sejam atualizados para `null`, `0`, `false` ou `""`.
            if (value !== undefined) {
                
                // ---------------------------------------------------------------------------
                // TODO: Adicionar lógica customizada para campos específicos (se necessário)
                // Se o seu controller precisar de um tratamento especial para alguma chave,
                // como buscar um ID em outra coleção, adicione a lógica aqui.
                //
                // Exemplo:
                /*
                if (key === 'algumIdDeRelacionamento') {
                    const documentoRelacionado = OutroController.find(value);
                    if (documentoRelacionado.error) {
                        // Você pode decidir como lidar com o erro.
                        // Talvez lançar uma exceção ou simplesmente não adicionar a chave.
                        return acc; 
                    }
                    acc['nomeDoCampoPopulado'] = documentoRelacionado;
                } else {
                    acc[key] = value;
                }
                */
                // ---------------------------------------------------------------------------

                // Para o template base, simplesmente adicionamos a chave e o valor.
                acc[key] = value;
            }

            return acc;
        }, {});

        // 2. Se nenhum campo válido foi enviado para atualização, retorna o documento original.
        if (Object.keys(fieldsToUpdate).length === 0) {
            console.log("Nenhum campo para atualizar foi fornecido.");
            return await this.find(__ModuleName__Id); 
        }

        // 3. Adiciona a data de atualização em toda modificação bem-sucedida.
        fieldsToUpdate.updatedAt = Util.currentDateTime('America/Sao_Paulo');

        // 4. Executa a atualização no banco de dados.
        const result = await __TitleModuleName__.updateOne(
            { _id: new ObjectId(__ModuleName__Id) },
            { $set: fieldsToUpdate }
        );

        if (result.matchedCount === 0) {
            return { error: "Não encontrado." };
        }

        // 5. Retorna o documento recém-atualizado para confirmar as alterações.
        return await this.find(__ModuleName__Id);
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
