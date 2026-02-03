import Joi from "joi";
import ErrorResponse from "../utils/ErrorResponse.js";

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      return next(new ErrorResponse(message, 400));
    }
    next();
  };
};

export const loginSchema = Joi.object({
  userId: Joi.string().required(),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().when("$isFirstLogin", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  newPassword: Joi.string().min(6).required(),
});

export const createUserSchema = Joi.object({
  role: Joi.string().valid("admin", "hod", "teacher", "student").required(),
  personalInfo: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid("male", "female", "other").optional(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zipCode: Joi.string(),
    }).optional(),
  }).required(),
  academicInfo: Joi.when("role", {
    is: "student",
    then: Joi.object({
      class: Joi.string().required(),
      section: Joi.string().required(),
      batchYear: Joi.number().required(),
      rollNumber: Joi.string().optional(),
      parentDetails: Joi.object({
        fatherName: Joi.string(),
        motherName: Joi.string(),
        parentPhone: Joi.string(),
        parentEmail: Joi.string().email(),
      }).optional(),
      guardianName: Joi.string(),
      guardianPhone: Joi.string(),
    }).required(),
    otherwise: Joi.optional(),
  }),
  departmentId: Joi.string().when("role", {
    is: "admin",
    then: Joi.optional(),
    otherwise: Joi.string().required(),
  }),
  assignTo: Joi.object({
    classes: Joi.array().items(
      Joi.object({
        class: Joi.string(),
        section: Joi.string(),
        subject: Joi.string(),
      }),
    ),
  }).optional(),
});

export default validate;
