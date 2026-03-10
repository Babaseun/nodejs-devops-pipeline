import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: 5432,
  password: process.env.DB_PASSWORD,
});
export default {
  query(text: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (params) {
        pool
          .query(text, params)
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      } else {
        pool
          .query(text)
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      }
    });
  },
};
