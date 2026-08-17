const { z } = require("zod");

const email = z.string().trim().toLowerCase().email().max(254);

class AuthValidator {
  static signupSchema = z.object({
    email,
    password: z.string().min(6).max(128),
    name: z.string().trim().min(1).max(50),
  });

  static loginSchema = z.object({
    email,
    password: z.string().min(1).max(128),
  });
}

module.exports = AuthValidator;
