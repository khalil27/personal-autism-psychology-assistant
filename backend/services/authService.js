const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key';

exports.login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const error = new Error('Invalid password');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  return { token, user: { id: user.id, role: user.role, email: user.email } };
};
