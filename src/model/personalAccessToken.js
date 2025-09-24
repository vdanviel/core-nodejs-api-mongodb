import { database } from "../connection/database.js";

class PersonalAccessTokenModel {
  constructor() {
    this.collection = database.collection('personal_access_token');
  }

  getCollection() {
    return this.collection;
  }
}

const PersonalAccessToken = new PersonalAccessTokenModel().getCollection();
export { PersonalAccessToken };