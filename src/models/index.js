const { Sequelize } = require('sequelize');
const sequelize = require('../config/db.config');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user.model')(sequelize);

// Define associations here if any
// Example:
// db.User.hasMany(db.Order, { foreignKey: 'userId' });

module.exports = db;
