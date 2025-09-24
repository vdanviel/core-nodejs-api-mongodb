import { database } from "../connection/database.js";

class CustomerModel {
  constructor() {
    this.collection = database.collection('customer');
  }

  getCollection() {
    return this.collection;
  }
}

const Customer = new CustomerModel().getCollection();
export { Customer };