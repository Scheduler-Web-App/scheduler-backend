const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // Create a new SchedulerItem
  router.post('/', async (req, res) => {
    const { account_email, title, start_timestamp, end_timestamp } = req.body;
    const query = 'INSERT INTO schedule_item(account_email, title, start_timestamp, end_timestamp) VALUES($1, $2, $3, $4) RETURNING *';
    const values = [account_email, title, start_timestamp, end_timestamp];

    try {
      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all SchedulerItems for a specific account_email
  router.get('/:account_email', async (req, res) => {
    const account_email = req.params.account_email;
    try {
      const result = await pool.query('SELECT * FROM schedule_item WHERE account_email = $1', [account_email]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update a SchedulerItem using account_email and title as unique identifiers (if applicable)
  router.put('/:account_email/:title', async (req, res) => {
    const { account_email, title } = req.params;
    const { start_timestamp, end_timestamp } = req.body;
    const query = 'UPDATE schedule_item SET start_timestamp = $1, end_timestamp = $2 WHERE account_email = $3 AND title = $4 RETURNING *';
    const values = [start_timestamp, end_timestamp, account_email, title];

    try {
      const result = await pool.query(query, values);
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ message: 'Item not found' });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete a SchedulerItem using account_email and title
  router.delete('/:account_email/:title', async (req, res) => {
    const { account_email, title } = req.params;
    try {
      const result = await pool.query('DELETE FROM schedule_item WHERE account_email = $1 AND title = $2 RETURNING *', [account_email, title]);
      if (result.rows.length > 0) {
        res.json({ message: 'Item deleted', item: result.rows[0] });
      } else {
        res.status(404).json({ message: 'Item not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return router;
};
