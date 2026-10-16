import { DataTypes } from 'sequelize';
import sequelize from '../config/db.config.js';

const Warehouse = sequelize.define(
  'Warehouse',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    warehouse_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone_print: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address_2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zip_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gst_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fssai_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    warehouse_maintainer: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    online_order: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    active_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft delete enabled (deleted_at)
    tableName: 'warehouses',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  }
);

export default Warehouse;
