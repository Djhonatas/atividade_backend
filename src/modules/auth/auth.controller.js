
const authService = require("./auth.service");

async function register(req, res) {
  const user = await authService.register(req.body);

  return res.status(201).json({
    message: "Usuário cadastrado com sucesso.",
    user,
  });
}

async function login(req, res) {
  const result = await authService.login(req.body);

  return res.status(200).json({
    message: "Login realizado com sucesso.",
    ...result,
  });
}

module.exports = {
  register,
  login,
};
