// Client-side auth handling: login and register
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const msg = document.getElementById('loginMsg');
      if (msg) msg.textContent = '';

      // ...existing code...
      if (!email || !password) { return; }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { return; }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) { return; }

        const data = await res.json().catch(()=>({}));
        if (data.token) localStorage.setItem('authToken', data.token);
        setTimeout(()=>{
          const userRole = data.role || 'teacher';
          if (userRole === 'teacher') location.href = 'teacher/dashboard.html';
          else location.href = 'student/dashboard.html';
        },700);
      } catch (err) { }
    });

      // No password toggle logic needed; icons are static
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const role = document.getElementById('role').value;
      const msg = document.getElementById('registerMsg');
      if (msg) msg.textContent='';

      // ...existing code...
      if (!name || !email || !password) { return; }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { return; }
      if (password.length < 8) { return; }
      if (password !== confirmPassword) { return; }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });

        if (!res.ok) { return; }

        const data = await res.json().catch(()=>({}));
        if (data.token) localStorage.setItem('authToken', data.token);
        setTimeout(()=>{
          if (role === 'teacher') location.href = 'teacher/dashboard.html';
          else location.href = 'student/dashboard.html';
        },900);
      } catch (err) { }
    });

    // password visibility toggles for register
      // No password toggle logic needed; icons are static
  }
});
