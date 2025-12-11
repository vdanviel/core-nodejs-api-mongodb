import { database } from "../connection/database.js";

class __TitleModuleName__Model {
  constructor() {
    this.collection = database.collection('__ModuleName__');
  }

  getCollection() {
    return this.collection;
  }
}

const __TitleModuleName__ = new __TitleModuleName__Model().getCollection();
export { __TitleModuleName__ };