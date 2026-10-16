import { DataTypes } from 'sequelize';
import sequelize from '../config/db.config.js';

const RolePermission = sequelize.define(
  'RolePermission',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    module_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    module_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    create_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    edit_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    view_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    delete_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: 'role_permissions',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default RolePermission;
