import { database } from "../../connection/database.js";

import Util from "../../util/util.js";

class RoleModel {

  constructor() {
    this.collection = database.collection('role');
  }

  getCollection() {
    return this.collection;
  }

  createCustomerRole(){

    const customerRole = this.collection.updateOne(
      {"name": "customer-role"},
      {
        $set: {
          name: "customer-role",
          permissions: ["read:customer", "read:barber"],
          description: "Permissões (scope) do cliente padrão. Usado para gerar JWT no sistema web service.",
          status: true,
          createdAt: Util.currentDateTime('America/Sao_Paulo'),
          updatedAt: Util.currentDateTime('America/Sao_Paulo')
        }
      },
      { upsert: true }
  );

    return customerRole;

  }

}

//instancia o model..
const Model = new RoleModel();

//cria as roles do sistema assim que é iniciado... read/write/update/delete
Model.createCustomerRole();

const Role = Model.getCollection();

export { Role };