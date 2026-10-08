import { ObjectId } from 'mongodb';
import { __TitleModuleName__ } from "../model/__TitleModuleName__.js";
import Util from "../util/Util.js"; // Importa Util, utilitario do sistema

class Controller {
	async find(id) {
		try {
			// Busca por ID
			const __ModuleName__ = await __TitleModuleName__.findOne({ _id: new ObjectId(id) });
			if (!__ModuleName__) {
				const err = new Error("Não encontrado.");
				err.status = 404;
				throw err;
			}
			return __ModuleName__;
		} catch (error) {
            Util.logInFile(error.stack, 'error.log'); // loga o erro no error.log
			const err = new Error("Aconteceu algum erro. Tente novamente mais tarde.");
			err.status = 500;
			throw err;
		}
	}

    async all(page = 1, size = 10, search = '', startDate, endDate) {
        // 1. Sanitização e Configuração da Paginação
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeSize = Math.max(1, parseInt(size) || 10);
        const skip = (safePage - 1) * safeSize;

        const filter = {};

        // 2. Filtro de Busca (Search)
        if (search) {
            const re = new RegExp(search, 'i');
            filter.$or = [
                { value_1: { $regex: re } },
                { value_2: { $regex: re } },
                { value_3: { $regex: re } }
            ];
        }

        // 3. Filtro de Intervalo de Datas (Tratando como STRING)
        // Precisamos garantir que startDate e endDate virem strings no mesmo formato do seu BD.
        // Vou assumir o formato 'YYYY-MM-DD'.
        if (startDate || endDate) {
            const range = {};

            if (startDate) {
                // Valida se é uma data válida e converte para string YYYY-MM-DD
                const sdObj = new Date(startDate);
                if (!isNaN(sdObj.valueOf())) {
                    // Pega a parte da data da string ISO (2023-10-25)
                    const sdString = sdObj.toISOString().split('T')[0];
                    range.$gte = sdString;
                }
            }

            if (endDate) {
                const edObj = new Date(endDate);
                if (!isNaN(edObj.valueOf())) {
                    // Para incluir o dia final inteiro numa comparação de string:
                    // Se o banco tem apenas datas '2023-10-25', usamos a própria data.
                    // Se o banco tem data e hora '2023-10-25 14:00', é mais seguro comparar
                    // até o final do dia ou usar o dia seguinte.
                    
                    // Abordagem simples (apenas data):
                    const edString = edObj.toISOString().split('T')[0];
                    
                    // Se no seu banco a string tiver HORA (ex: "2023-10-25 15:30"), 
                    // você deve concatenar o final do dia na string de busca:
                    // range.$lte = edString + " 23:59:59"; 
                    
                    range.$lte = edString;
                }
            }

            // Aplica o filtro se houver algo no range
            if (Object.keys(range).length > 0) {
                filter.begin_date = range;
            }
        }

        // 4. Execução da Consulta
        // Substitua '__TitleModuleName__' e '__ModuleName__' pelos nomes reais.
        const __ModuleName__ = await __TitleModuleName__.find(filter).skip(skip).limit(safeSize).toArray(); // Se estiver usando driver nativo
        // OU se estiver usando Mongoose, remova o .toArray() e use .exec() se necessário
        
        const total = await __TitleModuleName__.countDocuments(filter);

        // 5. Retorno dos Dados
        return {
            data: __ModuleName__,
            total,
            quantity: __ModuleName__.length,
            totalPages: Math.ceil(total / safeSize)
        };
    }

	async create(value1, value2, value3) {

        const data = {
            value_1: value1,
            value_2: value2,
            value_3: value3,
            status: true,
            created_at: Util.currentDateTime('America/Sao_Paulo'),
            updated_at: Util.currentDateTime('America/Sao_Paulo')
        };

        //restante dos dados...

		await __TitleModuleName__.insertOne(data);
		return data;
	}

    async update(__ModuleName__Id, value1, value2, value3) {

        try {
        // Dados que podem ser atualizados
        const updated_ata = {
            value_1: value1,
            value_2: value2,
            value_3: value3
            // Adicione outros campos que podem ser atualizados aqui...
        };
        
        // 1. Constrói dinamicamente o objeto $set, processando apenas os valores definidos.
        const fieldsToUpdate = Object.entries(updated_ata).reduce((acc, [key, value]) => {
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
                return await __TitleModuleName__.find(__ModuleName__Id); 
            }

            // 3. Adiciona a data de atualização em toda modificação bem-sucedida.
            fieldsToUpdate.updated_at = Util.currentDateTime('America/Sao_Paulo');

            // 4. Executa a atualização no banco de dados.
            const result = await __TitleModuleName__.updateOne(
                { _id: new ObjectId(__ModuleName__Id) },
                { $set: fieldsToUpdate }
            );

            if (result.matchedCount === 0) {
                const err = new Error("Não encontrado.");
                err.status = 404;
                err.code = "resource-not-found";
                throw err;
            }

            // 5. Retorna o documento recém-atualizado para confirmar as alterações.
            return await this.find(__ModuleName__Id);
        } catch (error) {
            if (error.status) throw error;
            const err = new Error("Aconteceu algum erro. Tente novamente mais tarde.");
            err.status = 500;
            throw err;
        }
    }

	async delete(__ModuleName__Id) {
		try {
			// Deleta registro
			const result = await __TitleModuleName__.deleteOne({ _id: new ObjectId(__ModuleName__Id) });
			if (result.deletedCount === 0) {
				const err = new Error("Não encontrado.");
				err.status = 404;
				err.code = "resource-not-found";
				throw err;
			}
			return { message: "Deletado com sucesso." };
		} catch (error) {
            Util.logInFile(error.stack, 'error.log'); // loga o erro no error.log
			const err = new Error("Aconteceu algum erro. Tente novamente mais tarde.");
			err.status = 500;
			throw err;
		}
	}

	async toggleStatus(__ModuleName__Id) {
		try {
			// Alterna status booleano
			const __ModuleName__ = await __TitleModuleName__.findOne({ _id: new ObjectId(__ModuleName__Id) });
			if (!__ModuleName__) {
				const err = new Error("Não encontrado.");
				err.status = 404;
				throw err;
			}

			const newStatus = !__ModuleName__.status;

			await __TitleModuleName__.updateOne(
				{ _id: new ObjectId(__ModuleName__Id) },
				{ $set: { status: newStatus, updated_at: Util.currentDateTime('America/Sao_Paulo') } }
			);
			return { message: `Status ${newStatus ? 'ativado' : 'desativado'} com sucesso.` };
		} catch (error) {
            Util.logInFile(error.stack, 'error.log'); // loga o erro no error.log
			const err = new Error("Aconteceu algum erro. Tente novamente mais tarde.");
			err.status = 500;
			throw err;
		}
	}
}

const __TitleModuleName__Controller = new Controller();
export { __TitleModuleName__Controller };
