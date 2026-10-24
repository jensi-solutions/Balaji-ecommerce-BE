import { Op } from 'sequelize';
import { Category } from '../models/index.js';
import { getFullFileUrl } from '../helpers/upload.helper.js';
import { slugify } from '../helpers/slug.helper.js';

/**
 * Format category response with full image URL
 */
const formatCategory = (req, categoryInstance) => {
  if (!categoryInstance) return null;
  const cat = typeof categoryInstance.toJSON === 'function' ? categoryInstance.toJSON() : categoryInstance;
  if (cat.image) {
    cat.image = getFullFileUrl(req, cat.image, 'categories');
  }
  if (cat.sub_categories && Array.isArray(cat.sub_categories)) {
    cat.sub_categories = cat.sub_categories.map((sub) => {
      const subJson = typeof sub.toJSON === 'function' ? sub.toJSON() : sub;
      if (subJson.image) {
        subJson.image = getFullFileUrl(req, subJson.image, 'categories');
      }
      return subJson;
    });
  }
  return cat;
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories/create
 */
export const createCategory = async (req, res) => {
  try {
    const { name, slug, parent_id, description, status } = req.body;

    const trimmedName = name ? name.trim() : '';
    let categorySlug = slug && slug.trim() ? slugify(slug) : slugify(trimmedName);

    if (!categorySlug) {
      categorySlug = `category-${Date.now()}`;
    }

    // Check duplicate slug
    const existingSlug = await Category.findOne({ where: { slug: categorySlug } });
    if (existingSlug) {
      return res.status(409).json({
        success: false,
        message: `Category with slug '${categorySlug}' already exists. Please provide a unique slug or name.`,
      });
    }

    // Check parent_id if provided
    let validParentId = null;
    if (parent_id && parent_id.trim() !== '') {
      const parentCat = await Category.findByPk(parent_id);
      if (!parentCat) {
        return res.status(404).json({
          success: false,
          message: `Parent category with ID '${parent_id}' not found.`,
        });
      }
      validParentId = parent_id;
    }

    // Determine image file path
    let imagePath = null;
    if (req.files) {
      if (Array.isArray(req.files)) {
        const imgFile = req.files.find((f) => f.fieldname === 'image' || f.fieldname === 'images' || f.fieldname === 'category_image');
        if (imgFile) imagePath = `uploads/categories/${imgFile.filename}`;
      } else if (req.files.image && req.files.image[0]) {
        imagePath = `uploads/categories/${req.files.image[0].filename}`;
      }
    } else if (req.file) {
      imagePath = `uploads/categories/${req.file.filename}`;
    } else if (req.body.image) {
      imagePath = req.body.image;
    }

    const newCategory = await Category.create({
      name: trimmedName,
      slug: categorySlug,
      parent_id: validParentId,
      image: imagePath,
      description: description ? description.trim() : null,
      status: status !== undefined ? Boolean(status === true || status === 'true' || status === 1 || status === '1') : true,
    });

    const categoryWithDetails = await Category.findByPk(newCategory.id, {
      include: [
        { model: Category, as: 'parent_category', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'sub_categories', attributes: ['id', 'name', 'slug'] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: formatCategory(req, categoryWithDetails),
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing category
 * @route   PUT /api/categories/update/:id
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const { name, slug, parent_id, description, status } = req.body;

    // Check slug uniqueness if changed
    if (slug || name) {
      const candidateSlug = slug && slug.trim() ? slugify(slug) : (name ? slugify(name) : category.slug);
      if (candidateSlug !== category.slug) {
        const existingSlug = await Category.findOne({
          where: {
            slug: candidateSlug,
            id: { [Op.ne]: id },
          },
        });
        if (existingSlug) {
          return res.status(409).json({
            success: false,
            message: `Category with slug '${candidateSlug}' already exists.`,
          });
        }
        category.slug = candidateSlug;
      }
    }

    // Validate parent_id
    if (parent_id !== undefined) {
      if (parent_id === id) {
        return res.status(400).json({
          success: false,
          message: 'A category cannot be its own parent.',
        });
      }

      if (parent_id && parent_id.trim() !== '') {
        const parentCategory = await Category.findByPk(parent_id);
        if (!parentCategory) {
          return res.status(404).json({
            success: false,
            message: `Parent category with ID '${parent_id}' not found.`,
          });
        }
        category.parent_id = parent_id;
      } else {
        category.parent_id = null;
      }
    }

    // Handle Image upload
    if (req.files) {
      if (Array.isArray(req.files)) {
        const imgFile = req.files.find((f) => f.fieldname === 'image' || f.fieldname === 'images' || f.fieldname === 'category_image');
        if (imgFile) category.image = `uploads/categories/${imgFile.filename}`;
      } else if (req.files.image && req.files.image[0]) {
        category.image = `uploads/categories/${req.files.image[0].filename}`;
      }
    } else if (req.file) {
      category.image = `uploads/categories/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      category.image = req.body.image;
    }

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description ? description.trim() : null;
    if (status !== undefined) {
      category.status = Boolean(status === true || status === 'true' || status === 1 || status === '1');
    }

    await category.save();

    const updatedCategory = await Category.findByPk(id, {
      include: [
        { model: Category, as: 'parent_category', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'sub_categories', attributes: ['id', 'name', 'slug'] },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: formatCategory(req, updatedCategory),
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all categories with pagination, search, and status filter
 * @route   GET /api/categories/all
 */
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * pageSize;
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status !== undefined && req.query.status !== null ? req.query.status.toString().trim().toLowerCase() : null;
    const parentId = req.query.parent_id !== undefined ? req.query.parent_id.toString().trim() : null;

    const whereCondition = {};

    if (status === 'true' || status === '1') {
      whereCondition.status = true;
    } else if (status === 'false' || status === '0') {
      whereCondition.status = false;
    }

    if (parentId !== null) {
      if (parentId === 'null' || parentId === '' || parentId === 'root') {
        whereCondition.parent_id = null;
      } else {
        whereCondition.parent_id = parentId;
      }
    }

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { slug: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: categories } = await Category.findAndCountAll({
      where: whereCondition,
      include: [
        { model: Category, as: 'parent_category', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'sub_categories', attributes: ['id', 'name', 'slug', 'image', 'status'] },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true,
    });

    const formattedCategories = categories.map((cat) => formatCategory(req, cat));

    return res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      perPage: pageSize,
      data: formattedCategories,
    });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get hierarchical tree of categories (Roots with nested sub-categories)
 * @route   GET /api/categories/tree
 */
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { parent_id: null, status: true },
      include: [
        {
          model: Category,
          as: 'sub_categories',
          where: { status: true },
          required: false,
          include: [
            {
              model: Category,
              as: 'sub_categories',
              where: { status: true },
              required: false,
            },
          ],
        },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Category, as: 'sub_categories' }, 'name', 'ASC'],
      ],
    });

    const formatted = categories.map((cat) => formatCategory(req, cat));

    return res.status(200).json({
      success: true,
      message: 'Category tree retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Error retrieving category tree:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all active categories without pagination (for dropdowns)
 * @route   GET /api/categories/withoutFilter
 */
export const getAllCategoriesWithoutFilter = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: true },
      include: [{ model: Category, as: 'parent_category', attributes: ['id', 'name', 'slug'] }],
      order: [['name', 'ASC']],
    });

    const formatted = categories.map((cat) => formatCategory(req, cat));

    return res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: formatted,
    });
  } catch (error) {
    console.error('Error retrieving categories without filter:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a category by ID
 * @route   GET /api/categories/:id (and /api/categories/get/:id)
 */
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [
        { model: Category, as: 'parent_category', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'sub_categories', attributes: ['id', 'name', 'slug', 'image', 'status'] },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: formatCategory(req, category),
    });
  } catch (error) {
    console.error('Error retrieving category:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update category status
 * @route   PUT /api/categories/status/:id
 */
export const updateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    category.status = Boolean(status === true || status === 'true' || status === 1 || status === '1');
    await category.save();

    return res.status(200).json({
      success: true,
      message: `Category status updated to ${category.status ? 'active' : 'inactive'} successfully`,
      data: formatCategory(req, category),
    });
  } catch (error) {
    console.error('Error updating category status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Soft delete a category by ID
 * @route   DELETE /api/categories/:id (and /delete/:id)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk soft delete categories
 * @route   POST /api/categories/multiple/delete
 */
export const deleteMultipleCategories = async (req, res) => {
  try {
    const { ids } = req.body;

    const deletedCount = await Category.destroy({
      where: {
        id: { [Op.in]: ids },
      },
    });

    return res.status(200).json({
      success: true,
      message: `${deletedCount} categories deleted successfully`,
      deletedCount,
      data: {},
    });
  } catch (error) {
    console.error('Error bulk deleting categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
