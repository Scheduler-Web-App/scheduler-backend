// routes/schedulerItemsRouter.js
const express = require('express');
const router = express.Router();
const { client } = require('..//db/db');

// Create a new SchedulerItem
router.post('/', async (req, res) => {
  const { title, startTime, endTime, contents } = req.body;
  const query = 'INSERT INTO scheduler_item(title, start_time, end_time, contents) VALUES($1, $2, $3, $4) RETURNING *';
  const values = [title, startTime, endTime, contents];

  try {
    const result = await client.query(query, values);
    res.status(201).send(result.rows[0]);
  } catch (error) {
    res.status(400).send(error.stack);
  }
});

// Get all SchedulerItems
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM scheduler_items');
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error.stack);
  }
});

// The pattern for additional CRUD operations (GET by ID, PATCH, DELETE) would be similar, utilizing `client.query`.

module.exports = router;
