async function renderStudentDashboard() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/scores/get-records`);
        const records = await res.json();
        
        const tbody = document.querySelector('#studentScoresTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        records.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.subject_id}</td>
                <td>${r.score}</td>
                <td>${r.is_finalized ? '✅ Verified' : '⏳ Pending'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error("Student dashboard error"); }
}
