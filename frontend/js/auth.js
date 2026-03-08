document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      try {
        // Updated to use the Centralized API
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password }) // Mapped to backend schema
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('username', email); // For Audit Trail
        }
        
        setTimeout(() => {
          const userRole = data.role || 'student';
          location.href = userRole === 'faculty' ? 'teacher/dashboard.html' : 'student/dashboard.html';
        }, 700);
      } catch (err) { console.error("Connection failed"); }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });

        if (!res.ok) return;
        location.href = 'signin.html';
      } catch (err) { console.error("Registration failed"); }
    });
  }
});
