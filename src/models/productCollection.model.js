import { DataTypes } from 'sequelize';
import sequelize from '../config/db.config.js';

const ProductCollection = sequelize.define(
  'ProductCollection',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    collection_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: 'product_collections',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ProductCollection;
