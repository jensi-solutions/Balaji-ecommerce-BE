import { Sequelize } from 'sequelize';
import sequelize from '../config/db.config.js';
import User from './user.model.js';
import Role from './role.model.js';

// Associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

export {
  sequelize,
  Sequelize,
  User,
  Role,
};
