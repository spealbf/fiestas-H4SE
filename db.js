const sql = require('mssql');

const config = {
  user: 'sa',
  password: '08022000',
  server: 'localhost', // o IP
  database: 'Fiestas',
  options: {
    trustServerCertificate: true,
  },
};

module.exports = {
  sql, config
};
