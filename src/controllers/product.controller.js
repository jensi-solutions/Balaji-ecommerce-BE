import { Op } from 'sequelize';
import {
  Product,
  ProductVariant,
  Collection,
  Category,
  ProductCollection,
  sequelize,
} from '../models/index.js';
import { getFullFileUrl } from '../helpers/upload.helper.js';
import { slugify } from '../helpers/slug.helper.js';

/**
 * Helper to safely parse JSON arrays or comma-delimited strings
 */
const safeParseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }
  return [value];
};

/**
 * Helper to parse indexed form-data fields like variants[0][price] or variants[0][attributes][size]
 */
const parseIndexedVariants = (body) => {
  const variants = [];
  const regex = /^variants\[(\d+)\]\[([a-zA-Z0-9_]+)\](?:\[([a-zA-Z0-9_]+)\])?$/;

  Object.keys(body || {}).forEach((key) => {
    const match = key.match(regex);
    if (match) {
      const index = parseInt(match[1], 10);
      const prop = match[2];
      const subProp = match[3];

      if (!variants[index]) variants[index] = {};

      if (subProp) {
        if (!variants[index][prop] || typeof variants[index][prop] !== 'object') {
          variants[index][prop] = {};
        }
        variants[index][prop][subProp] = body[key];
      } else {
        variants[index][prop] = body[key];
      }
    }
  });

  return variants.filter(Boolean);
};

/**
 * Format product response with full image URLs
 */
const formatProduct = (req, productInstance) => {
  if (!productInstance) return null;
  const prod = typeof productInstance.toJSON === 'function' ? productInstance.toJSON() : productInstance;

  if (prod.main_image) {
    prod.main_image = getFullFileUrl(req, prod.main_image, 'products');
  }

  if (prod.multiple_images) {
    const images = Array.isArray(prod.multiple_images)
      ? prod.multiple_images
      : safeParseArray(prod.multiple_images);
    prod.multiple_images = images.map((img) => getFullFileUrl(req, img, 'products'));
  } else {
    prod.multiple_images = [];
  }

  if (prod.variants && Array.isArray(prod.variants)) {
    prod.variants = prod.variants.map((v) => {
      const vJson = typeof v.toJSON === 'function' ? v.toJSON() : v;
      if (vJson.image) {
        vJson.image = getFullFileUrl(req, vJson.image, 'products');
      }
      if (vJson.attributes !== undefined && vJson.attributes !== null) {
        let attr = vJson.attributes;
        while (typeof attr === 'string') {
          try {
            attr = JSON.parse(attr);
          } catch {
            break;
          }
        }
        vJson.attributes = typeof attr === 'object' && attr !== null ? attr : {};
      }
      return vJson;
    });
  }

  if (prod.category && prod.category.image) {
    prod.category.image = getFullFileUrl(req, prod.category.image, 'categories');
  }

  if (prod.collections && Array.isArray(prod.collections)) {
    prod.collections = prod.collections.map((col) => {
      const colJson = typeof col.toJSON === 'function' ? col.toJSON() : col;
      if (colJson.image) colJson.image = getFullFileUrl(req, colJson.image, 'collections');
      if (colJson.banner_image) colJson.banner_image = getFullFileUrl(req, colJson.banner_image, 'collections');
      return colJson;
    });
  }

  return prod;
};

/**
 * @desc    Create a new product with variants and collections
 * @route   POST /api/products/create
 */
export const createProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      category_id,
      brand,
      description,
      short_description,
      is_featured,
      status,
      collection_ids,
      variants,
    } = req.body;

    const trimmedName = name ? name.trim() : '';
    // Auto-generate slug strictly from name (FE does not send slug)
    let productSlug = slugify(trimmedName) || `product-${Date.now()}`;

    // Clean if-else check (single DB query, no while loop)
    const existingProduct = await Product.findOne({ where: { slug: productSlug } });
    if (existingProduct) {
      productSlug = `${productSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Validate category_id if provided
    let validCategoryId = null;
    if (category_id && category_id.trim() !== '') {
      const categoryExists = await Category.findByPk(category_id);
      if (!categoryExists) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Category with ID '${category_id}' not found.`,
        });
      }
      validCategoryId = category_id;
    }

    // Validate collection_ids if provided
    const parsedCollectionIds = safeParseArray(collection_ids);
    if (parsedCollectionIds.length > 0) {
      const existingCollections = await Collection.findAll({
        where: { id: { [Op.in]: parsedCollectionIds } },
        attributes: ['id'],
      });
      if (existingCollections.length !== parsedCollectionIds.length) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'One or more collection IDs provided do not exist.',
        });
      }
    }

    // Handle Image uploads
    let mainImagePath = null;
    let multipleImagePaths = [];

    if (req.files) {
      if (Array.isArray(req.files)) {
        const mainFile = req.files.find((f) => f.fieldname === 'main_image' || f.fieldname === 'image');
        if (mainFile) mainImagePath = `uploads/products/${mainFile.filename}`;
        const multiFiles = req.files.filter((f) => f.fieldname === 'multiple_images' || f.fieldname === 'images');
        if (multiFiles.length > 0) {
          multipleImagePaths = multiFiles.map((file) => `uploads/products/${file.filename}`);
        }
      } else {
        if (req.files.main_image && req.files.main_image[0]) {
          mainImagePath = `uploads/products/${req.files.main_image[0].filename}`;
        }
        if (req.files.multiple_images && req.files.multiple_images.length > 0) {
          multipleImagePaths = req.files.multiple_images.map(
            (file) => `uploads/products/${file.filename}`
          );
        }
      }
    }

    if (!mainImagePath && req.body.main_image) {
      mainImagePath = req.body.main_image;
    }

    if (multipleImagePaths.length === 0 && req.body.multiple_images) {
      multipleImagePaths = safeParseArray(req.body.multiple_images);
    }

    // Parse Variants
    let parsedVariants = safeParseArray(variants);
    if (parsedVariants.length === 0) {
      parsedVariants = parseIndexedVariants(req.body);
    }

    if (parsedVariants.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Product must have at least one variant in "variants" with price.',
      });
    }

    // Validate SKU uniqueness for all variants
    const skusToCheck = [];
    parsedVariants.forEach((v, index) => {
      let vSku = v.sku && typeof v.sku === 'string' ? v.sku.trim() : '';
      if (!vSku) {
        vSku = `${productSlug}-VAR-${index + 1}`;
        v.sku = vSku;
      }
      skusToCheck.push(vSku);
    });

    const duplicateInRequest = skusToCheck.filter(
      (item, index) => skusToCheck.indexOf(item) !== index
    );
    if (duplicateInRequest.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Duplicate SKU '${duplicateInRequest[0]}' found in request variants.`,
      });
    }

    const existingSku = await ProductVariant.findOne({
      where: { sku: { [Op.in]: skusToCheck } },
    });
    if (existingSku) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: `Product variant with SKU '${existingSku.sku}' already exists.`,
      });
    }

    // 1. Create Product record
    const newProduct = await Product.create(
      {
        name: trimmedName,
        slug: productSlug,
        category_id: validCategoryId,
        brand: brand ? brand.trim() : null,
        description: description ? description.trim() : null,
        short_description: short_description ? short_description.trim() : null,
        main_image: mainImagePath,
        multiple_images: multipleImagePaths,
        is_featured: Boolean(is_featured === true || is_featured === 'true' || is_featured === 1 || is_featured === '1'),
        status: status !== undefined ? Boolean(status === true || status === 'true' || status === 1 || status === '1') : true,
      },
      { transaction }
    );

    // 2. Associate Collections
    if (parsedCollectionIds.length > 0) {
      const productCollectionRecords = parsedCollectionIds.map((colId) => ({
        product_id: newProduct.id,
        collection_id: colId,
      }));
      await ProductCollection.bulkCreate(productCollectionRecords, { transaction });
    }

    // 3. Create Product Variants
    const variantRecords = parsedVariants.map((v) => {
      let attr = v.attributes;
      if (typeof attr === 'string') {
        try {
          attr = JSON.parse(attr);
        } catch {
          attr = {};
        }
      }
      return {
        product_id: newProduct.id,
        sku: v.sku,
        price: Number(v.price),
        discount_price: v.discount_price !== undefined && v.discount_price !== '' && v.discount_price !== null ? Number(v.discount_price) : null,
        stock_quantity: v.stock_quantity !== undefined ? parseInt(v.stock_quantity, 10) : 0,
        attributes: attr || {},
        image: v.image || null,
        status: v.status !== undefined ? Boolean(v.status === true || v.status === 'true' || v.status === 1 || v.status === '1') : true,
      };
    });

    await ProductVariant.bulkCreate(variantRecords, { transaction });

    await transaction.commit();

    // Fetch full created product details
    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'image'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug', 'image'], through: { attributes: [] } },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: formatProduct(req, createdProduct),
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/update/:id
 */
export const updateProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const {
      name,
      category_id,
      brand,
      description,
      short_description,
      is_featured,
      status,
      collection_ids,
      variants,
    } = req.body;

    // Auto-update slug if name is changed (FE does not send slug)
    if (name && name.trim() && name.trim() !== product.name) {
      let candidateSlug = slugify(name);
      const existingProduct = await Product.findOne({
        where: { slug: candidateSlug, id: { [Op.ne]: id } },
      });
      if (existingProduct) {
        candidateSlug = `${candidateSlug}-${Date.now().toString().slice(-4)}`;
      }
      product.slug = candidateSlug;
    }

    // Validate category_id if provided
    if (category_id !== undefined) {
      if (category_id && category_id.trim() !== '') {
        const categoryExists = await Category.findByPk(category_id);
        if (!categoryExists) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: `Category with ID '${category_id}' not found.`,
          });
        }
        product.category_id = category_id;
      } else {
        product.category_id = null;
      }
    }

    // Update Collections if provided
    if (collection_ids !== undefined) {
      const parsedCollectionIds = safeParseArray(collection_ids);
      if (parsedCollectionIds.length > 0) {
        const existingCols = await Collection.findAll({
          where: { id: { [Op.in]: parsedCollectionIds } },
          attributes: ['id'],
        });
        if (existingCols.length !== parsedCollectionIds.length) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'One or more collection IDs provided do not exist.',
          });
        }
      }

      await ProductCollection.destroy({ where: { product_id: id }, transaction });
      if (parsedCollectionIds.length > 0) {
        const pcRecords = parsedCollectionIds.map((colId) => ({
          product_id: id,
          collection_id: colId,
        }));
        await ProductCollection.bulkCreate(pcRecords, { transaction });
      }
    }

    // Handle main_image & multiple_images uploads
    if (req.files) {
      if (Array.isArray(req.files)) {
        const mainFile = req.files.find((f) => f.fieldname === 'main_image' || f.fieldname === 'image');
        if (mainFile) product.main_image = `uploads/products/${mainFile.filename}`;
        const multiFiles = req.files.filter((f) => f.fieldname === 'multiple_images' || f.fieldname === 'images');
        if (multiFiles.length > 0) {
          const newImages = multiFiles.map((f) => `uploads/products/${f.filename}`);
          const currentImages = Array.isArray(product.multiple_images) ? product.multiple_images : [];
          product.multiple_images = [...currentImages, ...newImages];
        }
      } else {
        if (req.files.main_image && req.files.main_image[0]) {
          product.main_image = `uploads/products/${req.files.main_image[0].filename}`;
        }
        if (req.files.multiple_images && req.files.multiple_images.length > 0) {
          const newImages = req.files.multiple_images.map((f) => `uploads/products/${f.filename}`);
          const currentImages = Array.isArray(product.multiple_images) ? product.multiple_images : [];
          product.multiple_images = [...currentImages, ...newImages];
        }
      }
    }

    if (req.body.main_image !== undefined && (!req.files || !req.files.main_image)) {
      product.main_image = req.body.main_image;
    }

    if (req.body.multiple_images !== undefined && (!req.files || !req.files.multiple_images)) {
      product.multiple_images = safeParseArray(req.body.multiple_images);
    }

    if (name !== undefined) product.name = name.trim();
    if (brand !== undefined) product.brand = brand ? brand.trim() : null;
    if (description !== undefined) product.description = description ? description.trim() : null;
    if (short_description !== undefined) product.short_description = short_description ? short_description.trim() : null;
    if (is_featured !== undefined) {
      product.is_featured = Boolean(is_featured === true || is_featured === 'true' || is_featured === 1 || is_featured === '1');
    }
    if (status !== undefined) {
      product.status = Boolean(status === true || status === 'true' || status === 1 || status === '1');
    }

    await product.save({ transaction });

    // Handle Variants update if provided
    let parsedVariantsToUpdate = safeParseArray(variants);
    if (parsedVariantsToUpdate.length === 0) {
      parsedVariantsToUpdate = parseIndexedVariants(req.body);
    }

    if (parsedVariantsToUpdate.length > 0) {
      const existingVariants = await ProductVariant.findAll({
        where: { product_id: id },
      });

      const existingVariantMap = new Map(existingVariants.map((v) => [v.id, v]));
      const keptVariantIds = [];

      for (let i = 0; i < parsedVariantsToUpdate.length; i++) {
        const v = parsedVariantsToUpdate[i];
          let attr = v.attributes;
          if (typeof attr === 'string') {
            try {
              attr = JSON.parse(attr);
            } catch {
              attr = {};
            }
          }

          if (v.id && existingVariantMap.has(v.id)) {
            // Update existing variant
            const targetVariant = existingVariantMap.get(v.id);
            if (v.sku && v.sku.trim() !== targetVariant.sku) {
              const skuExists = await ProductVariant.findOne({
                where: { sku: v.sku.trim(), id: { [Op.ne]: v.id } },
              });
              if (skuExists) {
                await transaction.rollback();
                return res.status(409).json({
                  success: false,
                  message: `Product variant with SKU '${v.sku.trim()}' already exists.`,
                });
              }
              targetVariant.sku = v.sku.trim();
            }

            if (v.price !== undefined) targetVariant.price = Number(v.price);
            if (v.discount_price !== undefined) {
              targetVariant.discount_price = v.discount_price !== '' && v.discount_price !== null ? Number(v.discount_price) : null;
            }
            if (v.stock_quantity !== undefined) targetVariant.stock_quantity = parseInt(v.stock_quantity, 10);
            if (attr !== undefined) targetVariant.attributes = attr;
            if (v.image !== undefined) targetVariant.image = v.image;
            if (v.status !== undefined) {
              targetVariant.status = Boolean(v.status === true || v.status === 'true' || v.status === 1 || v.status === '1');
            }

            await targetVariant.save({ transaction });
            keptVariantIds.push(targetVariant.id);
          } else {
            // Create new variant
            const newSku = v.sku && v.sku.trim() ? v.sku.trim() : `${product.slug}-VAR-${Date.now().toString().slice(-4)}-${i}`;
            const skuExists = await ProductVariant.findOne({ where: { sku: newSku } });
            if (skuExists) {
              await transaction.rollback();
              return res.status(409).json({
                success: false,
                message: `Product variant with SKU '${newSku}' already exists.`,
              });
            }

            const createdVariant = await ProductVariant.create(
              {
                product_id: id,
                sku: newSku,
                price: Number(v.price),
                discount_price: v.discount_price !== undefined && v.discount_price !== '' && v.discount_price !== null ? Number(v.discount_price) : null,
                stock_quantity: v.stock_quantity !== undefined ? parseInt(v.stock_quantity, 10) : 0,
                attributes: attr || {},
                image: v.image || null,
                status: v.status !== undefined ? Boolean(v.status === true || v.status === 'true' || v.status === 1 || v.status === '1') : true,
              },
              { transaction }
            );
            keptVariantIds.push(createdVariant.id);
          }
        }

        // Soft delete variants that were removed
        const variantsToRemove = existingVariants.filter((ev) => !keptVariantIds.includes(ev.id));
        if (variantsToRemove.length > 0) {
          await ProductVariant.destroy({
            where: { id: { [Op.in]: variantsToRemove.map((vr) => vr.id) } },
            transaction,
          });
        }
      }

    await transaction.commit();

    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'image'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug', 'image'], through: { attributes: [] } },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: formatProduct(req, updatedProduct),
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all products with pagination, search, category, collection, price & status filters
 * @route   GET /api/products/all
 */
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * pageSize;
    const search = req.query.search ? req.query.search.trim() : '';
    const categoryId = req.query.category_id ? req.query.category_id.trim() : null;
    const collectionId = req.query.collection_id ? req.query.collection_id.trim() : null;
    const status = req.query.status !== undefined && req.query.status !== null ? req.query.status.toString().trim().toLowerCase() : null;
    const isFeatured = req.query.is_featured !== undefined && req.query.is_featured !== null ? req.query.is_featured.toString().trim().toLowerCase() : null;
    const minPrice = req.query.min_price ? Number(req.query.min_price) : null;
    const maxPrice = req.query.max_price ? Number(req.query.max_price) : null;

    const whereCondition = {};

    if (status === 'true' || status === '1') {
      whereCondition.status = true;
    } else if (status === 'false' || status === '0') {
      whereCondition.status = false;
    }

    if (isFeatured === 'true' || isFeatured === '1') {
      whereCondition.is_featured = true;
    } else if (isFeatured === 'false' || isFeatured === '0') {
      whereCondition.is_featured = false;
    }

    if (categoryId) {
      whereCondition.category_id = categoryId;
    }

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Prepare includes
    const collectionInclude = {
      model: Collection,
      as: 'collections',
      attributes: ['id', 'name', 'slug', 'image'],
      through: { attributes: [] },
    };
    if (collectionId) {
      collectionInclude.where = { id: collectionId };
      collectionInclude.required = true;
    }

    const variantWhere = {};
    if (minPrice !== null && !isNaN(minPrice)) {
      variantWhere.price = { ...(variantWhere.price || {}), [Op.gte]: minPrice };
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      variantWhere.price = { ...(variantWhere.price || {}), [Op.lte]: maxPrice };
    }

    const variantInclude = {
      model: ProductVariant,
      as: 'variants',
    };
    if (Object.keys(variantWhere).length > 0) {
      variantInclude.where = variantWhere;
      variantInclude.required = true;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'image'] },
        collectionInclude,
        variantInclude,
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    });

    const formattedProducts = products.map((prod) => formatProduct(req, prod));

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      perPage: pageSize,
      data: formattedProducts,
    });
  } catch (error) {
    console.error('Error retrieving products:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a product by ID
 * @route   GET /api/products/:id (and /api/products/get/:id)
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'image'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug', 'image'], through: { attributes: [] } },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: formatProduct(req, product),
    });
  } catch (error) {
    console.error('Error retrieving product:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a product by Slug (SEO friendly storefront route)
 * @route   GET /api/products/slug/:slug
 */
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      where: { slug: slug.trim(), status: true },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'image'] },
        { model: Collection, as: 'collections', attributes: ['id', 'name', 'slug', 'image'], through: { attributes: [] } },
        { model: ProductVariant, as: 'variants', where: { status: true }, required: false },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with slug '${slug}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: formatProduct(req, product),
    });
  } catch (error) {
    console.error('Error retrieving product by slug:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update product status
 * @route   PUT /api/products/status/:id
 */
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.status = Boolean(status === true || status === 'true' || status === 1 || status === '1');
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product status updated to ${product.status ? 'active' : 'inactive'} successfully`,
      data: formatProduct(req, product),
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update product featured flag
 * @route   PUT /api/products/featured/:id
 */
export const updateProductFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.is_featured = Boolean(is_featured === true || is_featured === 'true' || is_featured === 1 || is_featured === '1');
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Product featured status updated to ${product.is_featured} successfully`,
      data: formatProduct(req, product),
    });
  } catch (error) {
    console.error('Error updating product featured status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update stock quantity of a specific product variant
 * @route   PATCH /api/products/variants/:variant_id/stock
 */
export const updateVariantStock = async (req, res) => {
  try {
    const { variant_id } = req.params;
    const { stock_quantity } = req.body;

    const variant = await ProductVariant.findByPk(variant_id);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: `Product variant with ID '${variant_id}' not found`,
      });
    }

    variant.stock_quantity = parseInt(stock_quantity, 10);
    await variant.save();

    return res.status(200).json({
      success: true,
      message: 'Variant stock updated successfully',
      data: {
        id: variant.id,
        sku: variant.sku,
        stock_quantity: variant.stock_quantity,
        updated_at: variant.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating variant stock:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Soft delete a product and its variants by ID
 * @route   DELETE /api/products/:id (and /delete/:id)
 */
export const deleteProduct = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Soft delete associated variants
    await ProductVariant.destroy({
      where: { product_id: id },
      transaction,
    });

    // Soft delete product
    await product.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Product and associated variants deleted successfully',
      data: {},
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk soft delete products and their variants
 * @route   POST /api/products/multiple/delete
 */
export const deleteMultipleProducts = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { ids } = req.body;

    await ProductVariant.destroy({
      where: { product_id: { [Op.in]: ids } },
      transaction,
    });

    const deletedCount = await Product.destroy({
      where: { id: { [Op.in]: ids } },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `${deletedCount} products and their variants deleted successfully`,
      deletedCount,
      data: {},
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error bulk deleting products:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};