const express = require('express');
const authRoutes = require('../../src/modules/auth/auth.routes');
const errorHandler = require('../../src/middleware/error.middleware');

const app = express();

app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);

module.exports = app;
