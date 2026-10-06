import { DataTypes } from 'sequelize';
import sequelize from '../config/db.config.js';

const Role = sequelize.define(
  'Role',
  {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    role_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    default_role: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: 'roles',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Role;
