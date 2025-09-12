const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


['uploads/profile', 'uploads/others'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePic') cb(null, 'uploads/profile');
    else if (file.fieldname === 'otherPics') cb(null, 'uploads/others');
    else cb(new Error('Unknown field'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
}).fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'otherPics', maxCount: 5 }
]);




app.get('/', (req, res) => {
  res.render('form', { errors: [], old: {} });
});

app.post(
  '/submit',
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err) {
        return res.render('form', {
          errors: [{ msg: err.message }],
          old: req.body
        });
      }
      next();
    });
  },
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password')
      .isLength({ min: 5 })
      .withMessage('Password must be at least 5 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match');
      return true;
    }),
    body('email').isEmail().withMessage('Invalid email'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('hobbies').custom((value) => {
      if (!value) throw new Error('Select at least one hobby');
      if (Array.isArray(value) && value.length === 0)
        throw new Error('Select at least one hobby');
      return true;
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);

   
    if (!req.files || !req.files.profilePic || req.files.profilePic.length === 0) {
      errors.errors.push({ msg: 'Profile picture is required', param: 'profilePic' });
    }

    if (!errors.isEmpty()) {
    
      if (req.files) {
        for (const field in req.files) {
          req.files[field].forEach(file => {
            fs.unlink(file.path, () => {});
          });
        }
      }

      return res.render('form', {
        errors: errors.array(),
        old: req.body
      });
    }

    const profilePic = req.files.profilePic[0];
    const otherPics = req.files.otherPics || [];

    const data = {
      username: req.body.username,
      email: req.body.email,
      gender: req.body.gender,
      hobbies: Array.isArray(req.body.hobbies)
        ? req.body.hobbies
        : [req.body.hobbies],
      profilePicPath: '/uploads/profile/' + path.basename(profilePic.path),
      otherPicsPaths: otherPics.map((file) => '/uploads/others/' + path.basename(file.path)),
    };

   
    fs.writeFileSync('user_data.json', JSON.stringify(data, null, 2));

    res.render('result', { data });
  }
);


app.get('/download', (req, res) => {
  const filePath = path.join(__dirname, 'user_data.json');
  res.download(filePath, 'user_data.json', (err) => {
    if (err) {
      res.status(500).send('Error downloading file');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
