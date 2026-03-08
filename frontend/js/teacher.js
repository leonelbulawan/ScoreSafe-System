async function renderScoresTables() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/scores/get-records`);
        const records = await res.json();
        
        document.querySelectorAll('#scoresTable').forEach(table => {
            const tbody = table.querySelector('tbody');
            tbody.innerHTML = '';
            records.forEach((r) => {
                const tr = document.createElement('tr');
                const lockStatus = r.is_finalized ? '🔒' : '';
                tr.innerHTML = `
                    <td>${r.student_id} ${lockStatus}</td>
                    <td>${r.subject_id}</td>
                    <td>${r.score}</td>
                    <td>${r.category}</td>
                    <td>
                        <button class="btn" onclick="editScore(${r.id})">Edit</button>
                        <button class="btn outline" onclick="lockScore(${r.id})">Finalize</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
    } catch (e) { console.error("Data fetch failed"); }
}

async function editScore(id) {
    const newScore = prompt("New Score:");
    const editor = localStorage.getItem('username'); 
    
    await fetch(`${API_BASE_URL}/api/scores/update-score/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_score: newScore, editor_name: editor })
    });
    renderScoresTables();
}
