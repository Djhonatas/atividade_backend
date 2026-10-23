
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const repository = require("./auth.repository");
const { jwtSecret } = require("../../config/env");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function register({ name, email, password }) {
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    throw new AppError(
      "Informe nome, e-mail e senha com pelo menos 8 caracteres.",
      400
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await repository.findByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError("Este e-mail já está cadastrado.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    return await repository.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
  } catch (error) {
    // Protege contra duas requisições simultâneas com o mesmo e-mail.
    if (error.code === "23505") {
      throw new AppError("Este e-mail já está cadastrado.", 409);
    }

    throw error;
  }
}

async function login({ email, password }) {
  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    throw new AppError("E-mail e senha são obrigatórios.", 400);
  }

  const user = await repository.findByEmail(
    email.trim().toLowerCase()
  );

  if (
    !user ||
    !user.password_hash ||
    !(await bcrypt.compare(password, user.password_hash))
  ) {
    throw new AppError("E-mail ou senha inválidos.", 401);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    jwtSecret,
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

module.exports = {
  register,
  login,
};
