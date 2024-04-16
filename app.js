var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();



var app = express();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false  // Include or omit based on your DB configuration
  }
});

// Check database connection
async function checkDbConnection() {
  try {
    await pool.query('SELECT NOW()');  // This query is simple and effective for a connection check
    console.log('Connected to the database successfully!');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    throw err;  // Optionally re-throw to handle it elsewhere or exit
  }
}

checkDbConnection(); // Perform the check right after setting up the pool

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Signup Route
app.post('/signup', async (req, res) => {
  const { account_email, pin } = req.body;
  try {
    const hashedPin = await bcrypt.hash(pin, 10);
    const result = await pool.query(
      'INSERT INTO account(account_email, pin) VALUES($1, $2) RETURNING *',
      [account_email, hashedPin]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Signin Route
app.post('/signin', async (req, res) => {
  const { account_email, pin } = req.body;
  try {
    const result = await pool.query('SELECT * FROM account WHERE account_email = $1', [account_email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isValid = await bcrypt.compare(pin, user.pin);
      if (isValid) {
        res.json({ message: "Authentication successful", user: user.account_email });
      } else {
        res.status(401).json({ message: "Invalid email or pin" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
