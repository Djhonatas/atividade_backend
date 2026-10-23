
const { Pool } = require("pg");
const { databaseUrl } = require("../config/env");

const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on("error", (error) => {
  console.error("Erro inesperado no pool PostgreSQL:", error);
});

module.exports = pool;
