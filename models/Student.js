const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  rollNo: { type: String, unique: true },  // Add unique constraint
  name: String,
  fatherName: String,
  cnic: String,
  address: String,
  phoneNumber1: String,
  phoneNumber2: String,
  className: String,
  category: String,
  studentPic: String,
});

module.exports = mongoose.model('Student', studentSchema);
