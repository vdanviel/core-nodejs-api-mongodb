# Documentação do Core Node.js API MongoDB

O Core Node.js API MongoDB é um framework estruturado para desenvolvimento de APIs RESTful em Node.js, com organização clara de diretórios e separação de responsabilidades em MVC.
Ele já vem com o Google como uma integração configurada e utiliza o MongoDB integrado como sua base de dados.

### Estrutura do Projeto:

```plaintext
├── corenode.js // Console da aplicação (CLI) para executar scripts e comandos.
├── index.js // Ponto de entrada da aplicação, onde o servidor é iniciado.
└── src // Diretório principal que contém todo o código-fonte da aplicação.
    ├── command // Contém a lógica para os comandos executados pelo `corenode.js`.
    │   ├── generator // Scripts para gerar código automaticamente.
    │   │   └── moduleGenerator.js // Gera um novo módulo completo (controller, model, router).
    │   └── template // Moldes de arquivos usados pelo gerador de código.
    │       ├── complete // Templates com código de exemplo preenchido.
    │       │   ├── controllerTemplate.js // Molde para um Controller completo.
    │       │   ├── modelTemplate.js // Molde para um Model completo.
    │       │   └── routerTemplate.js // Molde para um Router completo.
    │       └── empty // Templates com a estrutura mínima (esqueleto).
    │           ├── controllerTemplate.js // Molde para um Controller vazio.
    │           ├── modelTemplate.js // Molde para um Model vazio.
    │           └── routerTemplate.js // Molde para um Router vazio.
    ├── connection // Gerencia a conexão com serviços externos.
    │   └── database.js // Contém a lógica de conexão com o banco de dados.
    ├── controller // Recebe as requisições HTTP e envia as respostas.
    │   ├── customerController.js // Controla as requisições relacionadas a clientes.
    │   └── personalAccessTokenController.js // Controla as requisições de tokens de acesso.
    ├── mail // Módulo responsável pelo envio de e-mails.
    │   ├── manager.js // Orquestra o envio de diferentes tipos de e-mail.
    │   ├── sender.js // Lida com a comunicação com o serviço de e-mail (ex: SendGrid).
    │   └── template // Contém os arquivos HTML dos e-mails.
    │       ├── changeEmail.html // Template para notificação de troca de e-mail.
    │       ├── forgotPassword.html // Template para recuperação de senha.
    │       └── welcome.html // Template de e-mail de boas-vindas.
    ├── middleware // Funções que executam entre a requisição e o controller.
    │   ├── auth.js // Middleware para verificar a autenticação do usuário.
    │   └── scope.js // Middleware para verificar as permissões (nível de acesso) do usuário.
    ├── model // Define a estrutura dos dados e interage com o banco de dados.
    │   ├── customer.js // Define o schema e os métodos para os dados de clientes.
    │   └── personalAccessToken.js // Define o schema para os tokens de acesso pessoal.
    ├── router // Define as rotas (endpoints) da API.
    │   ├── customerRouter.js // Define as rotas para o recurso de clientes (ex: /customers).
    │   ├── personalAcessTokenRouter.js // Define as rotas para gerenciar tokens.
    │   └── version // Diretório para versionamento da API.
    │       └── version1Router.js // Agrupa todas as rotas da versão 1 (ex: /api/v1).
    └── util // Contém funções e classes utilitárias reutilizáveis.
        └── util.js // Arquivo com helpers e funções genéricas.
```

### Fluxo de Requisição:
1. Requisição chega ao servidor `index.js`
2. `index.js` chama `src/router/version/version1Router.js` arquivo pelo qual tem todas as rotas atreladas a ele
3. `src/router/version/version1Router.js` chama a rota escolhida, exemplo *user*
4. A rota escolhida chama o seu *controller*
5. Controller chama o seu *model*
6. Processo volta com a resposta ao cliente

`index.js` ⬌ `src/router/version/version1Router.js` ⬌ rota ⬌ controller ⬌ model ⬌ banco de dados (`src/connection/database.js`)

### Model:

```javascript
import { database } from "../connection/database.js";

class FooModel {
  constructor() {
    this.collection = database.collection('Foo');
  }

  getCollection() {
    return this.collection;
  }
}

const Foo = new FooModel().getCollection();
export { Foo };
```

O sistema utiliza Sequelize para mapear tabelas do banco de dados em objetos JavaScript, permitindo interações com o banco de forma orientada a objetos.

Neste caso, está sendo definido um model para a tabela `foo`, com os seguintes campos:

- `id`: Campo inteiro, chave primária, auto incrementável.
- `name`: Campo do tipo `STRING`, representa o nome da entidade.
- `description`: Campo `STRING`, usado para uma descrição textual.
- `value`: Campo `FLOAT`, armazena um valor numérico com casas decimais.
- `status`: Campo `BOOLEAN`, que indica o status ativo ou inativo. Tem valor padrão `true`, ou seja, os registros são criados como ativos por padrão.

A definição é feita com `databaseInstance.define()`, informando os campos, seus tipos e validações. O nome da tabela é fixado como `"foo"` com a opção `tableName`.

Após definido, o model é exposto para uso na aplicação (por exemplo, em controllers ou services), permitindo executar operações como `create`, `findAll`, `update`, entre outras, de forma estruturada e reutilizável.

### Controller:

O controller centraliza a lógica de manipulação dos dados relacionados à entidade , utilizando os métodos do model para interagir com o banco de dados. Ele é responsável por orquestrar ações como criação, atualização, busca e exclusão de registros da tabela`.

Exemplo:
```javascript
import { ObjectId } from 'mongodb';
import { Foo } from "../model/foo.js";
import Util from "../util/util.js"; // Importa Util, utilitario do sistema

class Controller {
	async find(id) {
		const foo = await Foo.findOne({ _id: new ObjectId(id) });
		if (!foo) return { error: "Não encontrado." };
		return foo;
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

		await Foo.insertOne(data);
		return data;
	}

}

const fooController = new Controller();
export { fooController };


```

## Router:

O router é responsável por mapear as rotas da API relacionadas à entidade, conectando os endpoints HTTP com os métodos do controller. Ele também aplica autenticação, autorização e validações em cada requisição.

Exemplo:
```javascript

import express from "express";
import { fooController } from "../controller/fooController.js";

const fooRouter = express.Router();

fooRouter.get('/:id', (req, res) => {
	fooController.find(req.params.id)
		.then(result => {
			res.send(result);
		})
		.catch(error => {
			res.status(500).send({ error: error.message });
		});
});

fooRouter.post('/register', (req, res) => {
	const { value1, value2, value3 } = req.body;
	fooController.create(value1, value2, value3)
		.then(result => {
			res.send(result);
		})
		.catch(error => {
			res.status(500).send({ error: error.message });
		});
});

export { fooRouter };


```
## Corenode, a solução CLI para automatizar tarefas

O `corenode` é um CLI feito com `commander.js` utilizado para criar elementos dentro do ecosistema do projeto.

O comando base para uso é:

```plaintext
npm run corenode
```
### Geração de módulos (module)

Um módulo reúne os elementos principais do padrão MVC: **Model**, **Controller** e **Router**.  
Com os comandos `ação:module`, é possível gerenciar automaticamente toda a estrutura de um módulo, acelerando o desenvolvimento e eliminando etapas repetitivas.

---

#### Comandos Disponíveis

| Comando                                  | Descrição                        | Exemplo                                                  |
|------------------------------------------|----------------------------------|----------------------------------------------------------|
| `-- generate:module <name>`                 | Cria um novo módulo básico        | `npm run corenode -- generate:module user`                  |
| `-- generate:module <name> --mode complete` | Cria um módulo completo (MVC)     | `npm run corenode -- generate:module auth --mode complete`  |
| `-- remove:module <name>`                   | Remove um módulo existente        | `npm run corenode -- remove:module user`                    |
| `-- list:module`                            | Lista todos os módulos criados    | `npm run corenode -- list:module`                           |

## Como a API é versionada em RESTFULL:

O framework versiona a API em `src/router/version/`, lá é criado os arquivos das versões exemplo `version1Router.js` e dentro desse arquivo router todos os outro arquivos router ficam e ele é chamado em index.js (arquivo do servidor).

```javascript
//src/router/version/version1Router.js...

import express from "express";

//rotas
import { userRouter } from "../userRouter.js";
import { personalAccessTokenRouter } from "../personalAcessTokenRouter.js";
import { fooRouter } from "../fooRouter.js";

const version1Router = express.Router();

version1Router.use(`/user`, userRouter);
version1Router.use(`/foo`, fooRouter);
version1Router.use(`/token`, personalAccessTokenRouter);

export {version1Router};
```

Então é iniciado em `index.js`

```javascript
//index.js...

import express from "express";
import session from 'express-session';
import { version1Router } from "./src/router/version/version1Router.js";
import cors from 'cors';
import dotenv from 'dotenv'
dotenv.config();

const app = express();
const port = 3000

// passa a aplicação para application/json
app.use(express.json());

//configura o session
app.use(session({
  secret: process.env.SESSION_SECRET_PASS,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false // Deixa `false` para desenvolvimento (sem HTTPS). Em produção, coloque `true` se usar HTTPS.
  }
}));

//configura o cors
var corsOptions = {
  origin: process.env.SPA_APPLICATION_URL,
  optionsSuccessStatus: 200,
  credentials: true
}

//recupera todas as rotas da versão da API...
app.use("/v1", cors(corsOptions), version1Router);// É CHAMADO AQUI

//main
app.get('/', (req, res) => {

  return res.send("API V1 Core Node.js API");

});

app.listen(port, () => {
  console.log(`App de exemplo esta rodando na porta ${port}`)
});

```

###  Middlewares:

**Verifica a autenticação:**
```javascript
//src/middleware/auth.js...

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const isAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1]; // Se o cabeçalho existir, ele divide o conteúdo por espaço e pega o segundo item (o token em si)

    if (!bearerToken) {
        return res.status(401).json({ jwt_missing: 'No token provided.' });
    }

    jwt.verify(bearerToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ jwt_timeout: 'Invalid or expired token.' });
        }
        
        req.user = decoded;
        next();
    });
};

export {isAuth};
```

Esse middleware vai verificar se a hash JWT está presente e se está expirada.
Se estiver é retornado o erro 403 Forbidden (`res.status(403).json({ jwt_timeout: 'Invalid or expired token.' });`).
Se não estiver, ela vai guardar os dados do usuário em `req.user.data`, é possível acessar esse dado em todas as rota que tem o `isAuth` como middleware.

Exemplo:
```javascript
//router/userRouter.js...

userRouter.get('/me', isAuth, (req, res) => {// O isAuth está sendo definido como um middleware nessa rota

    UserController.find(req.user.data.id)// Então é possível acessar o "req.user.data" aqui
    .then(user => {

        return res.send(user);

    })
    .catch(error => {
        return res.status(500).send({ 
            error: error.message
        });
    });

});
```

**Checa o nível de permissão (Proteção por Escopo ou Função):**
```javascript
//src/middleware/scope.js...

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

const checkScope = (requiredScope) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token provided.' });

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded.scope || !decoded.scope.includes(requiredScope)) {
                return res.status(403).json({ message: 'Not allowed. Insufficient permission.' });
            }
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
    };
};

export {checkScope};
```

Este middleware vai verificar o nível de hierarquia que o usuário/entidade que está fazendo a requisição tem.
As permissões são definidas no momento em que o JWT é criado, no login:

```javascript
//src/controller/userController.js...

async login(email, password){

    // Começo do código...

    //criando o JWT...
    let encodedJwt = jwt.sign({
        data: foundUser,
        scope: ["read:foo", "write:foo", /* "delete:foo", */ "update:foo"] // As permissões devem ser definidas dentro do atributo "scope"
    }, process.env.JWT_SECRET, { expiresIn: '45h' });

    // Resto do código...

}
```

Eu estou usando um modelo de definição de permissão onde:
- `read`, `write`, `delete`, `update`, etc. **são ações**.
-  `foo`, `user`, `post`, etc. são **recursos/entidades**.

Você pode expandir isso como quiser. Exemplos:
- `read:adminPanel`
- `delete:user`
- `update:settings`
- `read:logs`

Para utilizar o `checkScope()` é só passar ele como um middleware e passar no parametro a permissão pelo qual você está buscando.

Exemplo:
```javascript
//src/router/fooRouter.js

fooRouter.get('/find/:id',[
    param('id').exists().withMessage("ID inválido.").notEmpty().withMessage("ID inválido."),
], [isAuth, checkScope('read:foo')], (req, res) => { // nessa linha está sendo usado "checkScope('read:foo')" que verifica se o usuário tem permissão de ler a entidade "foo"

// Resto do código

```

### Configuração Inicial:
Instale as dependências:
`npm install`

**Configure o arquivo `.env` na raiz do diretório:**
Antes de iniciar o framework, não esqueça de configurar o arquivo `.env` com todas as credenciais que pretende usar.

**Inicie o servidor com:**
`npm run dev`

Assim que o projeto for iniciado ele vai criar o **banco de dados** automaticamente.


## Convenções do projeto:
- MVC (Representado como Model/Controller/Router)
- JWT
- Autenticação / Autorização por escopo
- Integrações
- SOLID
- camelCase



