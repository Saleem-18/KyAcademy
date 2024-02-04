// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  rollNo: String,
  date: { type: Date, default: Date.now },
  name:String,
  phoneNumber1: String,
  phoneNumber2: String,
  className:String,
  isPresent: Boolean,
});

module.exports = mongoose.model('Attendance', attendanceSchema);
