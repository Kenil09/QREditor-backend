import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  link: Joi.string(),
}); 

export const updateSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  newPassword: Joi.string().min(6),
}); 

export const bulkBarcodeCreateSchema = Joi.object({
  amount: Joi.number().min(1).max(500).required(),
});

export const assignLink = Joi.object({
  user: Joi.string().required(),
  link: Joi.string().required(),
});

export const schema =Joi.object({
  name: Joi.string().allow(''),
  link: Joi.string().when('type', {
    is: 'link',
    then: Joi.string().required(),
  }),
  phoneNumber: Joi.string().when('type', {
    is: 'phoneNumber',
    then: Joi.string().required(),
  }),
  type: Joi.string().valid('image', 'pdf', 'link', 'phoneNumber').required(),
})

export const resetPasswordValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
}).required();

export const verifyResetPasswordValidation = Joi.object({
  token: Joi.string().required(),
  password : Joi.string().min(6)
}).required();

export const otpVerifyValidation = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  otp:Joi.string()
  .length(6)
  .pattern(/^[0-9]+$/)
  .required()
}).required();