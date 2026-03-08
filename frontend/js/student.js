// Student page JS - reads records and displays student-facing views
(function(){
	const STUDENTS_KEY = 'scoresafe_students';
	const SUBJECTS_KEY = 'scoresafe_subjects';
	const RECORDS_KEY = 'scoresafe_records';

	const read = (k) => JSON.parse(localStorage.getItem(k) || '[]');
	function byId(id){ return document.getElementById(id); }

	function getCurrentStudentEmail(){
		// allow ?email=... query param for preview; otherwise, show all
		const params = new URLSearchParams(location.search);
		const email = params.get('email');
		if (email) return email;
		const students = read(STUDENTS_KEY);
		return (students[0] && students[0].email) || null;
	}

	function renderStudentDashboard(){
		const email = getCurrentStudentEmail();
		// remove any unwanted sample records first
		cleanSampleRecords();
		const records = read(RECORDS_KEY).filter(r => !email || r.studentEmail === email);
		const subjects = new Set(records.map(r => r.subject));
		const totalScoresEl = byId('studentTotalScores');
		const totalSubjectsEl = byId('studentTotalSubjects');
		if (totalScoresEl) totalScoresEl.textContent = records.length;
		if (totalSubjectsEl) totalSubjectsEl.textContent = subjects.size;
		// render table
		const table = byId('studentScoresTable');
		if (!table) return;
		const tbody = table.querySelector('tbody');
		tbody.innerHTML = '';
		if (!records.length){
			const tr = document.createElement('tr'); tr.className='empty-row'; tr.innerHTML = '<td colspan="6">No records yet</td>'; tbody.appendChild(tr); return;
		}
		records.slice().reverse().forEach(r => {
			const tr = document.createElement('tr');
			const paper = r.paperDataUrl ? `<a class="view-link" href="${r.paperDataUrl}" target="_blank">View</a>` : '';
			const totalScoreDisplay = (r.score !== undefined && r.score !== null) ? r.score : '';
			const totalItemsDisplay = (r.totalItems !== undefined && r.totalItems !== null) ? r.totalItems : '';
			tr.innerHTML = `<td>${r.subject}</td><td>${totalScoreDisplay}</td><td>${totalItemsDisplay}</td><td>${paper}</td><td>${r.category}</td><td>${new Date(r.date).toLocaleString()}</td>`;
			tbody.appendChild(tr);
		});
	}

	function renderRecordsPage(){
		const email = getCurrentStudentEmail();
		cleanSampleRecords();
		const records = read(RECORDS_KEY).filter(r => !email || r.studentEmail === email);
		const table = byId('myRecordsTable');
		if (!table) return;
		const tbody = table.querySelector('tbody');
		tbody.innerHTML = '';
		if (!records.length){
			const tr = document.createElement('tr'); tr.className='empty-row'; tr.innerHTML = '<td colspan="6">No records yet</td>'; tbody.appendChild(tr); return;
		}
		records.slice().reverse().forEach(r => {
			const tr = document.createElement('tr');
			const paper = r.paperDataUrl ? `<a class="view-link" href="${r.paperDataUrl}" target="_blank">View</a>` : '';
			const totalScoreDisplay = (r.score !== undefined && r.score !== null) ? r.score : '';
			const totalItemsDisplay = (r.totalItems !== undefined && r.totalItems !== null) ? r.totalItems : '';
			tr.innerHTML = `<td>${r.subject}</td><td>${totalScoreDisplay}</td><td>${totalItemsDisplay}</td><td>${paper}</td><td>${r.category}</td><td>${new Date(r.date).toLocaleString()}</td>`;
			tbody.appendChild(tr);
		});
	}

	function init(){
		document.addEventListener('DOMContentLoaded', ()=>{
			// Hamburger menu toggle
			const hamburger = byId('hamburger');
			const nav = document.querySelector('nav');
			if (hamburger && nav) {
				hamburger.addEventListener('click', () => {
					nav.classList.toggle('active');
				});
			}

			// Logout button handler (show confirmation modal)
			function showSignOutModal(callback) {
				if (document.querySelector('.modal-overlay')) return;
				const overlay = document.createElement('div');
				overlay.className = 'modal-overlay';
				overlay.innerHTML = `
					<div class="modal" role="dialog" aria-modal="true" aria-labelledby="signout-title">
						<h3 id="signout-title">Sign out</h3>
						<p>Are you sure you want to sign out?</p>
						<div class="modal-buttons">
							<button class="btn outline btn-cancel"><i class="fas fa-times"></i> Cancel</button>
							<button class="btn btn-confirm"><i class="fas fa-sign-out-alt"></i> Sign out</button>
						</div>
					</div>
				`;
				document.body.appendChild(overlay);
				const cancelBtn = overlay.querySelector('.btn-cancel');
				const confirmBtn = overlay.querySelector('.btn-confirm');
				function cleanup() { overlay.remove(); }
				cancelBtn.focus();
				cancelBtn.addEventListener('click', (ev) => { ev.preventDefault(); cleanup(); });
				overlay.addEventListener('click', (ev) => { if (ev.target === overlay) cleanup(); });
				confirmBtn.addEventListener('click', (ev) => { ev.preventDefault(); cleanup(); if (typeof callback === 'function') callback(); });
				overlay.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') cleanup(); });
			}

			document.querySelectorAll('.logout-btn').forEach(btn => {
				btn.addEventListener('click', (e) => {
					e.preventDefault();
					showSignOutModal(() => {
						localStorage.removeItem('authToken');
						location.href = '../signin.html';
					});
				});
			});

			renderStudentDashboard();
			renderRecordsPage();
			// simple search handling
			const sInput = byId('studentSearchInput');
			if (sInput) sInput.addEventListener('input', ()=>{
				const q = sInput.value.toLowerCase().trim();
				document.querySelectorAll('#studentScoresTable tbody tr').forEach(tr=>{
					if (tr.classList.contains('empty-row')) return;
					tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
				});
			});
			const rSearch = byId('recordsSearch');
			if (rSearch) rSearch.addEventListener('input', ()=>{
				const q = rSearch.value.toLowerCase().trim();
				document.querySelectorAll('#myRecordsTable tbody tr').forEach(tr=>{
					if (tr.classList.contains('empty-row')) return;
					tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
				});
			});
		});

		// update when localStorage changes
		window.addEventListener('storage', (e)=>{
			if ([STUDENTS_KEY, SUBJECTS_KEY, RECORDS_KEY].includes(e.key) || e.key === 'scoresafe_last_update'){
				renderStudentDashboard(); renderRecordsPage();
			}
		});
	}

	init();
})();

// remove known sample record(s) that should not appear in student views
function cleanSampleRecords(){
	try{
		const records = JSON.parse(localStorage.getItem('scoresafe_records') || '[]');
		const filtered = records.filter(r => {
			// filter out example: Subject 'English', score 4, category 'Performance'
			if (!r) return true;
			if ((r.subject === 'English' || (r.subject && r.subject.toString().toLowerCase() === 'english'))
				&& Number(r.score) === 4
				&& (r.category === 'Performance' || (r.category && r.category.toString().toLowerCase() === 'performance'))){
				return false; // exclude
			}
			return true;
		});
		if (filtered.length !== records.length){
			localStorage.setItem('scoresafe_records', JSON.stringify(filtered));
		}
	}catch(e){ console.warn('cleanSampleRecords error', e); }
}

// Profile save/load for student page
(function(){
	const PROFILE_KEY = 'scoresafe_student_profile';
	function byId(id){ return document.getElementById(id); }

	function loadProfile(){
		const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
		if (!Object.keys(p).length) return;
		if (byId('studentFullName')) byId('studentFullName').value = p.fullName || '';
		if (byId('studentEmail')) byId('studentEmail').value = p.email || '';
		if (byId('studentBio')) byId('studentBio').value = p.bio || '';
		if (p.avatarDataUrl && byId('studentAvatarPreview')) byId('studentAvatarPreview').innerHTML = `<img src="${p.avatarDataUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover">`;
	}

	function saveProfile(dataUrl){
		const obj = {
			fullName: (byId('studentFullName') && byId('studentFullName').value) || '',
			email: (byId('studentEmail') && byId('studentEmail').value) || '',
			bio: (byId('studentBio') && byId('studentBio').value) || ''
		};
		// basic validation
		const msgEl = byId('studentProfileMsg');
		if (!obj.fullName || !obj.email) {
			if (msgEl){ msgEl.className='profile-msg error'; msgEl.textContent='Please provide your full name and email.'; }
			return false;
		}
		if (obj.email && !/^\S+@\S+\.\S+$/.test(obj.email)){
			if (msgEl){ msgEl.className='profile-msg error'; msgEl.textContent='Please provide a valid email address.'; }
			return false;
		}
		if (dataUrl) obj.avatarDataUrl = dataUrl;
		// preserve existing avatar if none provided
		const existing = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
		if (!obj.avatarDataUrl && existing.avatarDataUrl) obj.avatarDataUrl = existing.avatarDataUrl;
		localStorage.setItem(PROFILE_KEY, JSON.stringify(obj));
		if (byId('studentProfileMsg')){ const m = byId('studentProfileMsg'); m.className='profile-msg success'; m.textContent='Profile saved.'; setTimeout(()=>{ m.className='profile-msg'; m.textContent=''; },2500); }
		return true;
	}

	document.addEventListener('DOMContentLoaded', ()=>{
		if (!byId('studentProfileForm')) return;
		loadProfile();
			const avatarInput = byId('studentAvatar');
			const avatarPreview = byId('studentAvatarPreview');
			if (avatarInput) avatarInput.addEventListener('change', (e)=>{
				const f = e.target.files && e.target.files[0];
				if (!f) return;
				const r = new FileReader(); r.onload = ()=>{ if (byId('studentAvatarPreview')) byId('studentAvatarPreview').innerHTML = `<img src="${r.result}" alt="avatar">`; saveProfile(r.result); }; r.readAsDataURL(f);
			});
			byId('saveStudentProfile').addEventListener('click', (ev)=>{ ev.preventDefault(); saveProfile(); });
			byId('resetStudentProfile').addEventListener('click', (ev)=>{ ev.preventDefault(); localStorage.removeItem(PROFILE_KEY); if (byId('studentAvatarPreview')) byId('studentAvatarPreview').innerHTML=''; if (byId('studentProfileForm')) byId('studentProfileForm').reset(); if (byId('studentProfileMsg')){ const m = byId('studentProfileMsg'); m.className='profile-msg success'; m.textContent='Profile reset.'; setTimeout(()=>{ m.className='profile-msg'; m.textContent=''; },2000);} });
	});
})();
