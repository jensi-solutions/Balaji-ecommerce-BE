import { Op } from 'sequelize';
import { Collection, Product } from '../models/index.js';
import { getFullFileUrl } from '../helpers/upload.helper.js';
import { slugify } from '../helpers/slug.helper.js';

/**
 * Format collection response with full image URLs
 */
const formatCollection = (req, collectionInstance) => {
  if (!collectionInstance) return null;
  const col = typeof collectionInstance.toJSON === 'function' ? collectionInstance.toJSON() : collectionInstance;
  if (col.image) {
    col.image = getFullFileUrl(req, col.image, 'collections');
  }
  if (col.banner_image) {
    col.banner_image = getFullFileUrl(req, col.banner_image, 'collections');
  }
  return col;
};

/**
 * @desc    Create a new collection
 * @route   POST /api/collections/create
 */
export const createCollection = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const trimmedName = name ? name.trim() : '';
    // Auto-generate slug strictly from name (FE does not send slug)
    let collectionSlug = slugify(trimmedName) || `collection-${Date.now()}`;

    // Clean if-else check (single DB query, no while loop)
    const existingCollection = await Collection.findOne({ where: { slug: collectionSlug } });
    if (existingCollection) {
      collectionSlug = `${collectionSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Determine image file paths
    let imagePath = null;
    let bannerImagePath = null;

    if (req.files) {
      if (Array.isArray(req.files)) {
        const imgFile = req.files.find((f) => f.fieldname === 'image' || f.fieldname === 'images' || f.fieldname === 'collection_image');
        const bannerFile = req.files.find((f) => f.fieldname === 'banner_image' || f.fieldname === 'banner' || f.fieldname === 'bannerImage' || f.fieldname === 'banner_images');
        if (imgFile) imagePath = `uploads/collections/${imgFile.filename}`;
        if (bannerFile) bannerImagePath = `uploads/collections/${bannerFile.filename}`;
      } else {
        if (req.files.image && req.files.image[0]) {
          imagePath = `uploads/collections/${req.files.image[0].filename}`;
        }
        if (req.files.banner_image && req.files.banner_image[0]) {
          bannerImagePath = `uploads/collections/${req.files.banner_image[0].filename}`;
        }
      }
    } else if (req.file) {
      imagePath = `uploads/collections/${req.file.filename}`;
    }

    if (!imagePath && req.body.image) {
      imagePath = req.body.image;
    }
    if (!bannerImagePath && req.body.banner_image) {
      bannerImagePath = req.body.banner_image;
    }

    const newCollection = await Collection.create({
      name: trimmedName,
      slug: collectionSlug,
      image: imagePath,
      banner_image: bannerImagePath,
      description: description ? description.trim() : null,
      status: status !== undefined ? Boolean(status === true || status === 'true' || status === 1 || status === '1') : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: formatCollection(req, newCollection),
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing collection
 * @route   PUT /api/collections/update/:id
 */
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findByPk(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    const { name, description, status } = req.body;

    // Auto-update slug if name is changed (FE does not send slug)
    if (name && name.trim() && name.trim() !== collection.name) {
      let candidateSlug = slugify(name);
      const existingCollection = await Collection.findOne({
        where: { slug: candidateSlug, id: { [Op.ne]: id } },
      });
      if (existingCollection) {
        candidateSlug = `${candidateSlug}-${Date.now().toString().slice(-4)}`;
      }
      collection.slug = candidateSlug;
    }

    // Handle Image uploads
    if (req.files) {
      if (Array.isArray(req.files)) {
        const imgFile = req.files.find((f) => f.fieldname === 'image' || f.fieldname === 'images' || f.fieldname === 'collection_image');
        const bannerFile = req.files.find((f) => f.fieldname === 'banner_image' || f.fieldname === 'banner' || f.fieldname === 'bannerImage' || f.fieldname === 'banner_images');
        if (imgFile) collection.image = `uploads/collections/${imgFile.filename}`;
        if (bannerFile) collection.banner_image = `uploads/collections/${bannerFile.filename}`;
      } else {
        if (req.files.image && req.files.image[0]) {
          collection.image = `uploads/collections/${req.files.image[0].filename}`;
        }
        if (req.files.banner_image && req.files.banner_image[0]) {
          collection.banner_image = `uploads/collections/${req.files.banner_image[0].filename}`;
        }
      }
    } else if (req.file) {
      collection.image = `uploads/collections/${req.file.filename}`;
    }

    if (req.body.image !== undefined && (!req.files || !req.files.image)) {
      collection.image = req.body.image;
    }
    if (req.body.banner_image !== undefined && (!req.files || !req.files.banner_image)) {
      collection.banner_image = req.body.banner_image;
    }

    if (name !== undefined) collection.name = name.trim();
    if (description !== undefined) collection.description = description ? description.trim() : null;
    if (status !== undefined) {
      collection.status = Boolean(status === true || status === 'true' || status === 1 || status === '1');
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: formatCollection(req, collection),
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all collections with pagination, search, and status filter
 * @route   GET /api/collections/all
 */
export const getAllCollections = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * pageSize;
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status !== undefined && req.query.status !== null ? req.query.status.toString().trim().toLowerCase() : null;

    const whereCondition = {};

    if (status === 'true' || status === '1') {
      whereCondition.status = true;
    } else if (status === 'false' || status === '0') {
      whereCondition.status = false;
    }

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: collections } = await Collection.findAndCountAll({
      where: whereCondition,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const formattedCollections = collections.map((col) => formatCollection(req, col));

    return res.status(200).json({
      success: true,
      message: 'Collections retrieved successfully',
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      perPage: pageSize,
      data: formattedCollections,
    });
  } catch (error) {
    console.error('Error retrieving collections:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all active collections without pagination (for store/dropdowns)
 * @route   GET /api/collections/withoutFilter
 */
export const getAllCollectionsWithoutFilter = async (req, res) => {
  try {
    const collections = await Collection.findAll({
      where: { status: true },
      order: [['name', 'ASC']],
    });

    const formatted = collections.map((col) => formatCollection(req, col));

    return res.status(200).json({
      success: true,
      message: 'Collections retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Error retrieving collections without filter:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a collection by ID
 * @route   GET /api/collections/:id (and /api/collections/get/:id)
 */
export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findByPk(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Collection retrieved successfully',
      data: formatCollection(req, collection),
    });
  } catch (error) {
    console.error('Error retrieving collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update collection status
 * @route   PUT /api/collections/status/:id
 */
export const updateCollectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const collection = await Collection.findByPk(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    collection.status = Boolean(status === true || status === 'true' || status === 1 || status === '1');
    await collection.save();

    return res.status(200).json({
      success: true,
      message: `Collection status updated to ${collection.status ? 'active' : 'inactive'} successfully`,
      data: formatCollection(req, collection),
    });
  } catch (error) {
    console.error('Error updating collection status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Soft delete a collection by ID
 * @route   DELETE /api/collections/:id (and /delete/:id)
 */
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findByPk(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    await collection.destroy();

    return res.status(200).json({
      success: true,
      message: 'Collection deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk soft delete collections
 * @route   POST /api/collections/multiple/delete
 */
export const deleteMultipleCollections = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedCount = await Collection.destroy({
      where: {
        id: { [Op.in]: ids },
      },
    });

    return res.status(200).json({
      success: true,
      message: `${deletedCount} collections deleted successfully`,
      deletedCount,
      data: {},
    });
  } catch (error) {
    console.error('Error bulk deleting collections:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
