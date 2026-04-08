const express = require('express');

const usersRoutes = require('../../src/modules/users/users.routes');
const errorHandler = require('../../src/middleware/error.middleware');

const app = express();

app.use(express.json());
app.use('/api/v1/users', usersRoutes);
app.use(errorHandler);

module.exports = app;
