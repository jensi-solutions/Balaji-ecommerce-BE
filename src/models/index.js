import { Sequelize } from 'sequelize';
import sequelize from '../config/db.config.js';
import User from './user.model.js';
import Role from './role.model.js';
import RolePermission from './rolePermission.model.js';
import UserPermission from './userPermission.model.js';
import Warehouse from './warehouse.model.js';
import Coupon from './coupon.model.js';

// User & Role Associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role & RolePermission Associations
Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'role_permissions' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Role & UserPermission Associations
Role.hasMany(UserPermission, { foreignKey: 'role_id', as: 'user_permissions' });
UserPermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User & UserPermission Associations
User.hasMany(UserPermission, { foreignKey: 'user_id', as: 'user_permissions' });
UserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  sequelize,
  Sequelize,
  User,
  Role,
  RolePermission,
  UserPermission,
  Warehouse,
  Coupon,
};
