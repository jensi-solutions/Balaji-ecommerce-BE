const { Sequelize } = require('sequelize');
const sequelize = require('../config/db.config');

const db = {
  Sequelize,
  sequelize,
};

module.exports = db;
