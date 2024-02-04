const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path"); // Added for path module
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import your models here (User, Student, FeeRecord, Attendance)
const Student = require("./models/Student");
const FeeRecord = require("./models/FeeRecord");
const Attendance = require("./models/Attendance");

// Import your User model
const User = require("./models/User");

const defaultUsername = "admin";
const defaultPassword = "admin1818";

// Serve the static files from the React build
app.use(express.static(path.join(__dirname, "client/build")));

// Login route
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Check if the provided credentials match any user in the database
    const user = await User.findOne({ username, password }).exec();

    if (user) {
      res.json({ success: true, message: "Login successful" });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error during login" });
  }
});

// Enrollment route
app.post("/api/enroll", async (req, res) => {
  try {
    // Check if the rollNo already exists
    const existingStudent = await Student.findOne({
      rollNo: req.body.rollNo,
    }).exec();

    if (existingStudent) {
      // If rollNo already exists, return an error
      return res.status(400).json({
        error: `Student with Roll No ${req.body.rollNo} already exists`,
      });
    }

    // If rollNo is unique, proceed with enrollment
    const newStudent = await Student.create(req.body);
    res.json(newStudent);
  } catch (error) {
    res.status(500).json({ error: "Error enrolling student" });
  }
});

// Fee recording route
app.post("/api/record-fee", async (req, res) => {
  try {
    const { rollNo, month, year, amount } = req.body;

    // Check if the student with the given rollNo exists
    const existingStudent = await Student.findOne({ rollNo }).exec();

    if (!existingStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if the fee for the given month and year is already paid
    const existingFeeRecord = await FeeRecord.findOne({
      rollNo: existingStudent.rollNo,
      month,
      year,
      isPaid: true,
    }).exec();

    if (existingFeeRecord) {
      // If the fee is already paid, return an alert message
      return res
        .status(400)
        .json({ error: "Fee is already paid for the selected month and year" });
    }

    // Record the fee for the student
    const newFeeRecord = await FeeRecord.create({
      rollNo: existingStudent.rollNo,
      month,
      year,
      amount,
      isPaid: true,
    });

    res.json(newFeeRecord);
  } catch (error) {
    res.status(500).json({ error: "Error recording fee" });
  }
});

// Fetch unpaid fees route
app.get("/api/unpaid-fees", async (req, res) => {
  try {
    // Placeholder logic, update with actual logic to fetch unpaid fees
    const unpaidFees = [
      { rollNo: "1", name: "John Doe" },
      // Add more unpaid fees as needed
    ];

    res.json(unpaidFees);
  } catch (error) {
    res.status(500).json({ error: "Error fetching unpaid fees" });
  }
});

// Fetch fee records route
app.get("/api/fee-records/:identifier", async (req, res) => {
  const identifier = req.params.identifier;

  try {
    let feeRecords;

    // If the identifier is a valid MongoDB ObjectId, fetch records for a specific student
    feeRecords = await FeeRecord.find({ rollNo: identifier }).exec();

    res.json(feeRecords);
  } catch (error) {
    res.status(500).json({ error: "Error fetching fee records" });
  }
});

// Attendance route
// Attendance route
app.post("/api/record-attendance", async (req, res) => {
  try {
    const { rollNo, isPresent, scannedData } = req.body;

    // Retrieve className based on the entered rollNo
    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res
        .status(404)
        .json({ error: "Student not found for the given Roll No" });
    }

    // Check if attendance is recorded manually or through barcode scanning
    const source = scannedData ? "Barcode Scanner" : "Manual Entry";

    const newAttendanceRecord = await Attendance.create({
      rollNo,
      name: student.name,
      className: student.className,
      phoneNumber1: student.phoneNumber1,
      phoneNumber2: student.phoneNumber2,
      isPresent,
      source,
    });

    res.json(newAttendanceRecord);
  } catch (error) {
    res.status(500).json({ error: "Error recording attendance" });
  }
});

// Add a new route to handle barcode scanning separately
// Add a new route to handle barcode scanning separately
// Add a new route to handle barcode scanning separately
app.post("/api/record-attendance/barcode", async (req, res) => {
  try {
    const { scannedData } = req.body;

    // Example: Assume scannedData contains student information in a specific format
    // In a real-world scenario, you would parse the scannedData accordingly
    const parsedData = parseBarcodeData(scannedData);

    if (!parsedData || !parsedData.rollNo) {
      return res.status(400).json({ error: "Invalid barcode data" });
    }

    // Retrieve className based on the parsed rollNo
    const student = await Student.findOne({ rollNo: parsedData.rollNo });
    if (!student) {
      return res
        .status(404)
        .json({ error: "Student not found for the given Roll No" });
    }

    const rollNo = parsedData.rollNo;
    const name = student.name;
    const className = student.className;
    const phoneNumber1 = student.phoneNumber1;
    const phoneNumber2 = student.phoneNumber2;
    const isPresent = true; // Assuming the student is present when scanned
    const source = "Barcode Scanner";

    const newAttendanceRecord = await Attendance.create({
      rollNo,
      name,
      phoneNumber1,
      phoneNumber2,
      className,
      isPresent,
      source,
    });

    res.json(newAttendanceRecord);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error recording attendance from barcode scan" });
  }
});

// Example function to parse barcode data (replace this with your actual parsing logic)
function parseBarcodeData(scannedData) {
  try {
    // Dummy logic: Assume scannedData is a JSON string with student information
    const parsedData = JSON.parse(scannedData);
    return parsedData;
  } catch (error) {
    console.error("Error parsing barcode data:", error.message);
    return null;
  }
}

app.get("/api/check-attendance/:rollNo", async (req, res) => {
  const rollNo = req.params.rollNo;

  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const existingStudent = await Student.findOne({ rollNo }).exec();

    if (!existingStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    const existingAttendance = await Attendance.findOne({
      rollNo,
      date: {
        $gte: currentDate,
        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
      },
    }).exec();

    res.json(existingAttendance || { isPresent: false });
  } catch (error) {
    res.status(500).json({ error: "Error checking existing attendance" });
  }
});

/// Attendance records route
// Attendance records route
// Attendance records route
// Attendance records route
app.get("/api/attendance-records", async (req, res) => {
  try {
    const className = req.query.className;
    const status = req.query.status;
    const month = req.query.month;
    const day = req.query.day;
    const year = req.query.year;
    // console.log('Parameters:', className, status, month, day, year);

    // Validate inputs
    if (!className || !status || !month || !day || !year) {
      return res.status(400).json({ error: "Invalid input parameters" });
    }

    // Calculate start and end dates for the selected day
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    let records;

    if (status === "true") {
      // Fetch present students
      records = await Attendance.find({
        className: className,
        isPresent: true,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }).exec();
    } else if (status === "false") {
      // Fetch students with no attendance record for the selected date
      const presentStudentRollNos =
        (await Attendance.distinct("rollNo", {
          className: className,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        }).exec()) || [];

      records = await Student.find({
        className: className,
        rollNo: { $nin: presentStudentRollNos },
      }).exec();

      // Create absent records with isPresent set to false
      records = records.map((student) => ({
        _id: student._id,
        rollNo: student.rollNo,
        name: student.name,
        phoneNumber1: student.phoneNumber1,
        phoneNumber2: student.phoneNumber2,
        className: student.className,
        isPresent: false,
      }));
    } else {
      return res.status(400).json({ error: "Invalid status parameter" });
    }

    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance records:", error.message);
    res.status(500).json({ error: "Error fetching attendance records" });
  }
});

// Update student route
app.put("/api/update-student/:rollNo", async (req, res) => {
  const rollNo = req.params.rollNo;
  const updatedStudentData = req.body;

  try {
    const existingStudent = await Student.findOne({ rollNo }).exec();

    if (!existingStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    Object.assign(existingStudent, updatedStudentData);
    const updatedStudent = await existingStudent.save();

    res.json({ student: updatedStudent });
  } catch (error) {
    console.error("Error updating student record:", error.message);
    res.status(500).json({ error: "Error updating student record" });
  }
});

// Record fetch route
app.get("/api/student-info/:rollNo", async (req, res) => {
  const rollNo = req.params.rollNo;
  try {
    const studentRecord = await Student.findOne({ rollNo }).exec();

    if (!studentRecord) {
      return res.status(404).json({ error: "Student not found" });
    }

    const responseData = {
      student: studentRecord,
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: "Error fetching record" });
  }
});

// Define a route to fetch the latest 5 attendances
app.get("/api/latest-attendances", async (req, res) => {
  try {
    const latestAttendances = await Attendance.find({})
      .sort({ date: -1 }) // Sort in descending order based on date
      .limit(5)
      .exec();

    res.json({ attendances: latestAttendances });
  } catch (error) {
    console.error("Error fetching latest attendances:", error.message);
    res.status(500).json({ error: "Error fetching latest attendances" });
  }
});

// For any other routes, serve the index.html from the React build
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
