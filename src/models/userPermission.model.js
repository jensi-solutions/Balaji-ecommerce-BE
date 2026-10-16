import { DataTypes } from 'sequelize';
import sequelize from '../config/db.config.js';

const UserPermission = sequelize.define(
  'UserPermission',
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    module_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_extra: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    module_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_extra_view: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    view_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_extra_create: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    create_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_extra_edit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    edit_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_extra_delete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
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
    tableName: 'user_permissions',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default UserPermission;
