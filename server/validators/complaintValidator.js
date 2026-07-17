const { body, validationResult } = require('express-validator');
const { COMPLAINT_PRIORITY } = require('../constants');

const validateCreateComplaint = [
  body('title')
    .notEmpty()
    .withMessage('Complaint title is required')
    .isLength({ max: 100 })
    .withMessage('Complaint title cannot exceed 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Complaint description detail is required')
    .trim(),
  body('category')
    .notEmpty()
    .withMessage('Complaint Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),
  body('priority')
    .optional()
    .isIn(Object.values(COMPLAINT_PRIORITY))
    .withMessage('Invalid priority selected'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateCreateComplaint
};
