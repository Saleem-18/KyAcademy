// models/FeeRecord.js
const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  //studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  rollNo: String,
  month: String,
  year: Number,
  amount: Number,
  isPaid: Boolean,
});

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
