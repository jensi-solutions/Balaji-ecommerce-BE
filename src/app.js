const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middlewares/errorHandler.middleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Balaji Backend API",
    status: "Server is active",
  });
});

// API Routes
app.use("/api", routes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
