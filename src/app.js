
const express = require("express");
const authRoutes = require("./modules/auth/auth.routes");
const checkoutRoutes = require("./modules/checkout/checkout.routes");
const errorHandler = require("./middlewares/error-handler");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API funcionando." });
});

app.use(authRoutes);
app.use("/checkout", checkoutRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Rota não encontrada.",
  });
});

app.use(errorHandler);

module.exports = app;
