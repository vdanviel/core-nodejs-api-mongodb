import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

class Database {
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      }
    });

    this.db = null;

  }

  async openConnection() {
    try {

      await this.client.connect();

      this.db = await this.client.db(process.env.MONGODB_DBNAME)
      console.log("Successfully connected to database.");
      
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async close() {
    await this.client.close();
  }

}

// Cria e exporta uma instância única do banco de dados e conecta
const databaseInstance = new Database();

// Conecta ao banco de dados
await databaseInstance.openConnection();

// Exporta a instância do banco de dados
const database = databaseInstance.db;

export { database };