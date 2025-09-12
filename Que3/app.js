const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;  // ✅ use .default
const { createClient } = require('redis');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Redis client setup
let redisClient = createClient({ legacyMode: true }); // ✅ legacyMode is required
redisClient.connect().catch(console.error);

// Session store using connect-redis v6+
let redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    store: redisStore,
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }, // 1 hour
  })
);

const users = {
  admin: { username: 'admin', password: 'admin123' },
};

function authMiddleware(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/', authMiddleware, (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && user.password === password) {
    req.session.user = { username: user.username };
    return res.redirect('/');
  }
  res.render('login', { error: 'Invalid username or password' });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
