import { database } from "../../connection/database.js";

class AuthModel {
  constructor() {
    this.collection = database.collection('auth');
  }

  getCollection() {
    return this.collection;
  }
}

const Auth = new AuthModel().getCollection();
export { Auth };