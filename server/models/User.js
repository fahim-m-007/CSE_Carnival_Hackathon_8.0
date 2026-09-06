import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    default: 'Assistant Professor'
  },
  department: {
    type: String,
    default: 'Department of Computer Science & Engineering'
  },
  university: {
    type: String,
    default: 'Ahsanullah University of Science and Technology'
  },
  initials: {
    type: String,
    default: 'FM'
  },
  role: {
    type: String,
    enum: ['faculty', 'in_charge', 'admin'],
    default: 'faculty'
  }
}, {
  timestamps: true
});

// Password comparison supporting bcrypt hashes and plain demo passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(enteredPassword, this.password);
  }
  return enteredPassword === this.password;
};

// Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
