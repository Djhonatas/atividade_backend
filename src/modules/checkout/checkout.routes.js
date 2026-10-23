
const express = require("express");
const controller = require("./checkout.controller");

const router = express.Router();

router.post("/", controller.create);

module.exports = router;
