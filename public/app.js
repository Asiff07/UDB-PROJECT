const API_BASE = 'http://localhost:5000/api';
let performanceChart;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initForms();
    refreshDashboard();
    
    document.getElementById('seedBtn').addEventListener('click', seedData);
});

function initNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.section;

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(s => {
                s.classList.add('hidden');
                if (s.id === target) s.classList.remove('hidden');
            });

            if (target === 'dashboard') refreshDashboard();
            if (target === 'students') fetchStudents();
        });
    });
}

async function refreshDashboard() {
    try {
        const [avgRes, topRes, highRes, studentsRes] = await Promise.all([
            fetch(`${API_BASE}/analytics/average-marks`).then(r => r.json()),
            fetch(`${API_BASE}/analytics/top-performers`).then(r => r.json()),
            fetch(`${API_BASE}/analytics/high-performers`).then(r => r.json()),
            fetch(`${API_BASE}/students`).then(r => r.json())
        ]);

        console.log('Dashboard Data Loaded:', { avgRes, topRes, highRes, studentsRes });

        document.getElementById('totalStudents').innerText = studentsRes.length || 0;
        document.getElementById('highPerformersCount').innerText = highRes.length || 0;
        
        const overallAvg = avgRes.reduce((acc, curr) => acc + curr.averageScore, 0) / (avgRes.length || 1);
        document.getElementById('classAverage').innerText = `${overallAvg.toFixed(1)}%`;

        const topList = document.getElementById('topPerformersList');
        topList.innerHTML = topRes.map((p, i) => `
            <li style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="display: flex; align-items: center; gap: 0.5rem">
                    <b style="color: var(--primary)">#${i+1}</b> ${p.name}
                </span>
                <b>${p.averageScore}%</b>
            </li>
        `).join('');

        const highTable = document.querySelector('#highPerformersTable tbody');
        highTable.innerHTML = highRes.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.averageScore}%</td>
            </tr>
        `).join('');

        updateChart(avgRes);
    } catch (err) {
        console.error('Frontend Error: Failed to refresh dashboard:', err);
        showToast('Error loading data from server');
    }
}

function updateChart(data) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (performanceChart) performanceChart.destroy();

    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Average Score (%)',
                data: data.map(d => d.averageScore),
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: 4,
                barThickness: 24
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: 100, 
                    grid: { color: '#f1f5f9' }, 
                    ticks: { color: '#64748b', font: { family: 'Outfit' } } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#64748b', font: { family: 'Outfit' } } 
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

async function fetchStudents() {
    const res = await fetch(`${API_BASE}/students`);
    const students = await res.json();
    const tbody = document.querySelector('#studentsTable tbody');
    tbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.student_id}</td>
            <td>${s.name}</td>
            <td>${s.department}</td>
            <td>
                <button onclick="deleteStudent('${s.student_id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student and their marks?')) return;
    await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
    showToast('Student deleted successfully');
    fetchStudents();
}

function initForms() {
    document.getElementById('studentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            student_id: document.getElementById('student_id').value,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            department: document.getElementById('department').value
        };

        const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('Student added successfully');
            e.target.reset();
            fetchStudents();
        } else {
            const err = await res.json();
            alert(`Error: ${err.error}`);
        }
    });

    document.getElementById('marksForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            student_id: document.getElementById('m_student_id').value,
            subject_code: document.getElementById('m_subject').value,
            marks: Number(document.getElementById('m_marks').value),
            semester: Number(document.getElementById('m_semester').value)
        };

        const res = await fetch(`${API_BASE}/marks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('Marks saved successfully');
            e.target.reset();
        } else {
            const err = await res.json();
            alert(`Error: ${err.error}`);
        }
    });
}

async function seedData() {
    const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
    if (res.ok) {
        showToast('Demo data seeded successfully');
        refreshDashboard();
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
