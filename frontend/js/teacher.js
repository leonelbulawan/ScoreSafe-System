// Teacher page JS - manages students, subjects, scores and papers

const STUDENTS_KEY = 'scoresafe_students';
const SUBJECTS_KEY = 'scoresafe_subjects';
const RECORDS_KEY = 'scoresafe_records';

function byId(id) { return document.getElementById(id); }

async function read(key) {
    let url = '';
    if (key === STUDENTS_KEY) url = '/api/teacher/get-students';
    else if (key === SUBJECTS_KEY) url = '/api/teacher/get-subjects';
    else if (key === RECORDS_KEY) url = '/api/scores/get-records';
    if (!url) return [];
    const res = await fetch(url);
    return res.ok ? await res.json() : [];
}

async function write(key, val) {
    let url = '';
    if (key === STUDENTS_KEY) url = '/api/teacher/add-student';
    else if (key === SUBJECTS_KEY) url = '/api/teacher/add-subject';
    else if (key === RECORDS_KEY) url = '/api/scores/upload-score';
    if (!url) return;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(val)
    });
}

function populateSelect(selectEl, items, placeholder) {
    if (!selectEl) return;
    selectEl.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder || '-- Select --';
    selectEl.appendChild(empty);
    items.forEach(it => {
        const o = document.createElement('option');
        o.value = it.email || it.name || it;
        o.textContent = it.name || it.email || it;
        selectEl.appendChild(o);
    });
}

async function renderStudentsTable() {
    const table = byId('studentsTable');
    if (!table) return;
    const students = await read(STUDENTS_KEY);
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    if (!students.length) {
        const tr = document.createElement('tr');
        tr.className = 'empty-row';
        tr.innerHTML = '<td colspan="3">No students yet</td>';
        tbody.appendChild(tr);
        return;
    }
    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.email}</td><td>${s.name}</td><td><button class="btn outline" data-email="${s.email}" data-action="delete-student">Delete</button></td>`;
        tbody.appendChild(tr);
    });
}

async function handleStudentForm() {
    const form = byId('addStudentForm');
    const msg = byId('studentMsg');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = byId('studentEmail').value.trim();
        const name = byId('studentName').value.trim();
        if (!email || !name) return;
        const students = await read(STUDENTS_KEY);
        if (students.find(s => s.email === email)) {
            msg.textContent = 'Student already exists.'; return;
        }
        students.push({ email, name });
        await write(STUDENTS_KEY, students);
        form.reset();
        msg.textContent = 'Student added.';
        await renderStudentsTable();
        broadcastUpdate();
    });
}

async function handleStudentTableActions() {
    const table = byId('studentsTable');
    if (!table) return;
    table.addEventListener('click', async e => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        if (btn.dataset.action === 'delete-student') {
            const email = btn.dataset.email;
            let students = await read(STUDENTS_KEY);
            students = students.filter(s => s.email !== email);
            await write(STUDENTS_KEY, students);
            await renderStudentsTable();
            broadcastUpdate();
        }
    });
}

async function refreshSelects() {
    const students = await read(STUDENTS_KEY);
    const subjects = await read(SUBJECTS_KEY);
    const sEls = [byId('studentSelect'), byId('studentSelectUpload'), byId('studentSelect')];
    const suEls = [byId('subjectSelect'), byId('subjectSelectUpload'), byId('subjectSelectUpload')];
    const studentOpts = students.map(s => ({ email: s.email, name: s.name }));
    sEls.forEach(el => { if (el) populateSelect(el, studentOpts, '-- Select Student --'); });
    suEls.forEach(el => { if (el) populateSelect(el, subjects, '-- Select Subject --'); });
}

async function renderScoresTables() {
    const records = await read(RECORDS_KEY);
    const students = await read(STUDENTS_KEY);
    document.querySelectorAll('#scoresTable').forEach(table => {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        if (!records.length) {
            const tr = document.createElement('tr');
            tr.className = 'empty-row';
            tr.innerHTML = `<td colspan="${table.querySelectorAll('th').length}">No records yet</td>`;
            tbody.appendChild(tr);
            return;
        }
        records.slice().reverse().forEach((r, idx) => {
            const tr = document.createElement('tr');
            const student = students.find(s => s.email === r.studentEmail);
            const studentName = student ? student.name : r.studentEmail;
            const paperLink = r.paperDataUrl ? `<a class="view-link" href="${r.paperDataUrl}" target="_blank">View</a>` : '';
            const totalScoreDisplay = (r.score !== undefined && r.score !== null) ? r.score : '';
            const totalItemsDisplay = (r.totalItems !== undefined && r.totalItems !== null) ? r.totalItems : '';
            tr.innerHTML = `<td>${studentName}</td><td>${r.subject}</td><td>${totalScoreDisplay}</td><td>${totalItemsDisplay}</td><td>${paperLink}</td><td>${r.category}</td><td>${new Date(r.date).toLocaleString()}</td><td><button class="btn outline" data-idx="${idx}" data-action="edit-record">Edit</button> <button class="btn outline" data-idx="${idx}" data-action="delete-record">Delete</button></td>`;
            tbody.appendChild(tr);
        });
    });
}

async function handleRecordForm() {
    const recordForm = byId('recordScoreForm');
    if (!recordForm) return;
    recordForm.addEventListener('submit', async e => {
        e.preventDefault();
        const studentEmail = byId('studentSelect').value;
        const subject = byId('subjectSelect').value;
        const category = byId('categorySelect').value;
        const score = byId('score').value;
        const totalItemsVal = (byId('totalItemsInput') && byId('totalItemsInput').value) ? byId('totalItemsInput').value.trim() : '';
        const file = byId('paperFile').files[0];
        if (!studentEmail || !subject || !category) return;
        const record = { studentEmail, subject, category, score: Number(score), date: Date.now() };
        if (totalItemsVal !== '') record.totalItems = Number(totalItemsVal);
        if (file) {
            const reader = new FileReader();
            reader.onload = async function() {
                record.paperName = file.name;
                record.paperDataUrl = reader.result;
                const records = await read(RECORDS_KEY);
                records.push(record);
                await write(RECORDS_KEY, records);
                recordForm.reset();
                await renderScoresTables();
                broadcastUpdate();
            };
            reader.readAsDataURL(file);
        } else {
            const records = await read(RECORDS_KEY);
            records.push(record);
            await write(RECORDS_KEY, records);
            recordForm.reset();
            await renderScoresTables();
            broadcastUpdate();
        }
    });
}

async function handleUploadForm() {
    const uploadForm = byId('uploadPaperForm');
    if (!uploadForm) return;
    uploadForm.addEventListener('submit', async e => {
        e.preventDefault();
        const studentEmail = byId('studentSelectUpload').value;
        const subject = byId('subjectSelectUpload').value;
        const category = byId('categorySelectUpload').value;
        const file = byId('paperFile').files[0];
        if (!studentEmail || !subject || !file) return;
        const reader = new FileReader();
        reader.onload = async function() {
            const dataUrl = reader.result;
            const records = await read(RECORDS_KEY);
            records.push({ studentEmail, subject, category, paperName: file.name, paperDataUrl: dataUrl, date: Date.now() });
            await write(RECORDS_KEY, records);
            uploadForm.reset();
            await renderScoresTables();
            broadcastUpdate();
        };
        reader.readAsDataURL(file);
    });
}

async function handleScoresTableActions() {
    document.addEventListener('click', async e => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const idx = Number(btn.dataset.idx);
        const records = await read(RECORDS_KEY);
        const realIdx = records.length - 1 - idx;
        if (btn.dataset.action === 'delete-record') {
            records.splice(realIdx, 1);
            await write(RECORDS_KEY, records);
            await renderScoresTables();
            broadcastUpdate();
        } else if (btn.dataset.action === 'edit-record') {
            const tr = btn.closest('tr');
            const tds = tr.querySelectorAll('td');
            const studentTd = tds[0];
            const subjectTd = tds[1];
            const scoreTd = tds[2];
            const totalItemsTd = tds[3];
            const categoryTd = tds[5];
            const actionsTd = tds[7];
            const originalStudent = records[realIdx].studentEmail;
            const originalSubject = records[realIdx].subject;
            const originalTotalItems = records[realIdx].totalItems || '';
            const originalScore = records[realIdx].score || '';
            const originalCategory = records[realIdx].category;
            const students = await read(STUDENTS_KEY);
            const subjects = await read(SUBJECTS_KEY);
            let studentSelect = '<select style="width: 150px; cursor: pointer; appearance: none; background-image: url(&quot;data:image/svg+xml,%3csvg xmlns=&apos;http://www.w3.org/2000/svg&apos; fill=&apos;none&apos; viewBox=&apos;0 0 20 20&apos;%3e%3cpath stroke=&apos;%236b7280&apos; stroke-linecap=&apos;round&apos; stroke-linejoin=&apos;round&apos; stroke-width=&apos;1.5&apos; d=&apos;m6 8 4 4 4-4&apos;/%3e%3c/svg%3e&quot;); background-position: right 12px center; background-repeat: no-repeat; background-size: 16px; padding-right: 40px; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; background-color: #ffffff; color: #1e293b; transition: all 0.2s ease; box-sizing: border-box;>';
            students.forEach(s => {
                studentSelect += `<option value="${s.email}" ${s.email === originalStudent ? 'selected' : ''}>${s.name}</option>`;
            });
            studentSelect += '</select>';
            let subjectSelect = '<select style="width: 100px; cursor: pointer; appearance: none; background-image: url(&quot;data:image/svg+xml,%3csvg xmlns=&apos;http://www.w3.org/2000/svg&apos; fill=&apos;none&apos; viewBox=&apos;0 0 20 20&apos;%3e%3cpath stroke=&apos;%236b7280&apos; stroke-linecap=&apos;round&apos; stroke-linejoin=&apos;round&apos; stroke-width=&apos;1.5&apos; d=&apos;m6 8 4 4 4-4&apos;/%3e%3c/svg%3e&quot;); background-position: right 12px center; background-repeat: no-repeat; background-size: 16px; padding-right: 40px; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; background-color: #ffffff; color: #1e293b; transition: all 0.2s ease; box-sizing: border-box;>';
            subjects.forEach(s => {
                subjectSelect += `<option value="${s}" ${s === originalSubject ? 'selected' : ''}>${s}</option>`;
            });
            subjectSelect += '</select>';
            studentTd.innerHTML = studentSelect;
            subjectTd.innerHTML = subjectSelect;
            scoreTd.innerHTML = `<input type="number" value="${originalScore}" style="width: 60px;">`;
            totalItemsTd.innerHTML = `<input type="number" value="${originalTotalItems}" style="width: 80px;">`;
            categoryTd.innerHTML = `<select style="width: 100px; cursor: pointer; appearance: none; background-image: url(&quot;data:image/svg+xml,%3csvg xmlns=&apos;http://www.w3.org/2000/svg&apos; fill=&apos;none&apos; viewBox=&apos;0 0 20 20&apos;%3e%3cpath stroke=&apos;%236b7280&apos; stroke-linecap=&apos;round&apos; stroke-linejoin=&apos;round&apos; stroke-width=&apos;1.5&apos; d=&apos;m6 8 4 4 4-4&apos;/%3e%3c/svg%3e&quot;); background-position: right 12px center; background-repeat: no-repeat; background-size: 16px; padding-right: 40px; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; background-color: #ffffff; color: #1e293b; transition: all 0.2s ease; box-sizing: border-box;"><option value="Performance" ${originalCategory === 'Performance' ? 'selected' : ''}>Performance</option><option value="Activity" ${originalCategory === 'Activity' ? 'selected' : ''}>Activity</option><option value="Quiz" ${originalCategory === 'Quiz' ? 'selected' : ''}>Quiz</option><option value="Recitation" ${originalCategory === 'Recitation' ? 'selected' : ''}>Recitation</option><option value="Examination" ${originalCategory === 'Examination' ? 'selected' : ''}>Examination</option></select>`;
            actionsTd.innerHTML = `<button class="btn" data-idx="${idx}" data-action="save-edit">Save</button> <button class="btn outline" data-idx="${idx}" data-action="cancel-edit">Cancel</button>`;
        } else if (btn.dataset.action === 'save-edit') {
            const tr = btn.closest('tr');
            const tds = tr.querySelectorAll('td');
            const studentSelect = tds[0].querySelector('select');
            const subjectSelect = tds[1].querySelector('select');
            const scoreInput = tds[2].querySelector('input');
            const totalItemsInput = tds[3].querySelector('input');
            const categorySelect = tds[5].querySelector('select');
            records[realIdx].studentEmail = studentSelect.value;
            records[realIdx].subject = subjectSelect.value;
            const totalItemsValEdit = totalItemsInput && totalItemsInput.value ? totalItemsInput.value.trim() : '';
            if (totalItemsValEdit !== '') records[realIdx].totalItems = Number(totalItemsValEdit);
            else delete records[realIdx].totalItems;
            records[realIdx].score = scoreInput && scoreInput.value ? Number(scoreInput.value) : undefined;
            records[realIdx].category = categorySelect.value;
            await write(RECORDS_KEY, records);
            await renderScoresTables();
            broadcastUpdate();
        } else if (btn.dataset.action === 'cancel-edit') {
            await renderScoresTables();
        }
    });
}

function broadcastUpdate() {
    localStorage.setItem('scoresafe_last_update', Date.now());
}

async function main() {
    await renderStudentsTable();
    await handleStudentForm();
    await handleStudentTableActions();
    await refreshSelects();
    await renderScoresTables();
    await handleRecordForm();
    await handleUploadForm();
    await handleScoresTableActions();
}

main();
