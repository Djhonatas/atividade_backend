
const checkoutService = require("./checkout.service");

async function create(req, res) {
  const order = await checkoutService.createCheckout(req.body);

  return res.status(202).json({
    message: "Checkout recebido para processamento.",
    order,
  });
}

module.exports = {
  create,
};
