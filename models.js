const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    student_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true }
});



const subjectSchema = new mongoose.Schema({
    subject_code: { type: String, required: true, unique: true },
    name: { type: String, required: true }
});

const markSchema = new mongoose.Schema({
    student_id: { type: String, required: true },
    subject_code: { type: String, required: true },
    marks: { type: Number, required: true, min: 0, max: 100 },
    semester: { type: Number, required: true }
});

const Student = mongoose.model('Student', studentSchema);
const Subject = mongoose.model('Subject', subjectSchema);
const Mark = mongoose.model('Mark', markSchema);

module.exports = { Student, Subject, Mark };
