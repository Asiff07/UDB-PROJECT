require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Student, Subject, Mark } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Database Connected !');
    })
    .catch(err => {
        console.log('Database Connection Failed !');
        console.error('Error:', err.message);
    });

app.post('/api/students', async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find();
        console.log(`Found ${students.length} students`);
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/students/:id', async (req, res) => {
    try {
        const student = await Student.findOneAndUpdate({ student_id: req.params.id }, req.body, { new: true });
        res.json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    try {
        await Student.findOneAndDelete({ student_id: req.params.id });
        await Mark.deleteMany({ student_id: req.params.id });
        res.json({ message: 'Student and related marks deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/marks', async (req, res) => {
    try {
        const mark = new Mark(req.body);
        await mark.save();
        res.status(201).json(mark);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/marks/:student_id', async (req, res) => {
    try {
        const marks = await Mark.find({ student_id: req.params.student_id });
        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analytics/average-marks', async (req, res) => {
    try {
        const results = await Mark.aggregate([
            {
                $group: {
                    _id: "$student_id",
                    averageScore: { $avg: "$marks" },
                    totalSubjects: { $count: {} }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "student_id",
                    as: "studentDetails"
                }
            },
            { $unwind: "$studentDetails" },
            {
                $project: {
                    student_id: "$_id",
                    name: "$studentDetails.name",
                    averageScore: { $round: ["$averageScore", 2] },
                    totalSubjects: 1
                }
            }
        ]);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analytics/top-performers', async (req, res) => {
    try {
        const results = await Mark.aggregate([
            {
                $group: {
                    _id: "$student_id",
                    averageScore: { $avg: "$marks" }
                }
            },
            { $sort: { averageScore: -1 } },
            { $limit: 3 },
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "student_id",
                    as: "studentDetails"
                }
            },
            { $unwind: "$studentDetails" },
            {
                $project: {
                    name: "$studentDetails.name",
                    averageScore: { $round: ["$averageScore", 2] }
                }
            }
        ]);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analytics/high-performers', async (req, res) => {
    try {
        const results = await Mark.aggregate([
            {
                $group: {
                    _id: "$student_id",
                    averageScore: { $avg: "$marks" }
                }
            },
            { $match: { averageScore: { $gt: 75 } } },
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "student_id",
                    as: "studentDetails"
                }
            },
            { $unwind: "$studentDetails" },
            {
                $project: {
                    student_id: "$_id",
                    name: "$studentDetails.name",
                    averageScore: { $round: ["$averageScore", 2] }
                }
            }
        ]);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/seed', async (req, res) => {
    try {
        await Student.deleteMany({});
        await Mark.deleteMany({});
        console.log('Cleared existing data');

        const students = [
            { student_id: "S001", name: "Asif", email: "asif@example.com", department: "CS" },
            { student_id: "S002", name: "Riya", email: "riya@example.com", department: "IT" },
            { student_id: "S003", name: "Rahul", email: "rahul@example.com", department: "ECE" },
            { student_id: "S004", name: "Sara", email: "sara@example.com", department: "CS" }
        ];
        await Student.insertMany(students);

        const marks = [
            { student_id: "S001", subject_code: "CS101", marks: 85, semester: 1 },
            { student_id: "S001", subject_code: "MATH101", marks: 90, semester: 1 },
            { student_id: "S002", subject_code: "CS101", marks: 70, semester: 1 },
            { student_id: "S002", subject_code: "MATH101", marks: 65, semester: 1 },
            { student_id: "S003", subject_code: "CS101", marks: 95, semester: 1 },
            { student_id: "S003", subject_code: "MATH101", marks: 88, semester: 1 },
            { student_id: "S004", subject_code: "CS101", marks: 45, semester: 1 }
        ];
        await Mark.insertMany(marks);

        console.log('Seed data inserted successfully');
        res.json({ message: "Seed data created successfully" });
    } catch (error) {
        console.error('Seed Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
