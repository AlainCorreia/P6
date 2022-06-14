const Joi = require('joi');

exports.schema = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string().required(),
  manufacturer: Joi.string().required(),
  description: Joi.string().required(),
  mainPepper: Joi.string().required(),
  imageUrl: Joi.string(),
  heat: Joi.number().integer().min(1).max(10).required()
});

exports.schemaNoImage = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string().required(),
  manufacturer: Joi.string().required(),
  description: Joi.string().required(),
  mainPepper: Joi.string().required(),
  heat: Joi.number().integer().min(1).max(10).required()
});