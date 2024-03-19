import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  link: Joi.string(),
});

export const bulkBarcodeCreateSchema = Joi.object({
  amount: Joi.number().min(1).max(500).required(),
});

export const assignLink = Joi.object({
  user: Joi.string().required(),
  link: Joi.string().required(),
});

export const schema =Joi.object({
  name: Joi.string().required(),
  link: Joi.string().required(),
  type: Joi.string().valid('image', 'pdf', 'link', 'text').required(),
})