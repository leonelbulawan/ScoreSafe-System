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

      const show = (text, cls) => {
        if (msg) { msg.textContent = text; msg.className = cls; }
        else { alert(text); }
      };

      if (!email || !password) { show('Please fill in all fields.', 'error-msg'); return; }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { show('Please enter a valid email.', 'error-msg'); return; }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
          const err = await res.json().catch(()=>({message:'Login failed'}));
          show(err.message || 'Login failed', 'error-msg');
          return;
        }

        const data = await res.json().catch(()=>({}));
        // store token if provided
        if (data.token) localStorage.setItem('authToken', data.token);
        show('Signed in successfully', 'success-msg');
        // redirect based on returned role when available
        setTimeout(()=>{
          const userRole = data.role || 'teacher';
          if (userRole === 'teacher') location.href = 'teacher/dashboard.html';
          else location.href = 'student/dashboard.html';
        },700);

      } catch (err) {
        show('Unable to reach server', 'error-msg');
      }
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

      const show = (text, cls) => {
        if (msg) { msg.textContent = text; msg.className = cls; }
        else { alert(text); }
      };

      if (!name || !email || !password) { show('Please fill in all fields.', 'error-msg'); return; }
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { show('Please enter a valid email.', 'error-msg'); return; }
      if (password.length < 8) { show('Password must be at least 8 characters.', 'error-msg'); return; }
      if (password !== confirmPassword) { show('Passwords do not match.', 'error-msg'); return; }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });

        if (!res.ok) {
          const err = await res.json().catch(()=>({message:'Registration failed'}));
          show(err.message || 'Registration failed', 'error-msg');
          return;
        }

        const data = await res.json().catch(()=>({}));
        show('Account created — signing in...', 'success-msg');
        if (data.token) localStorage.setItem('authToken', data.token);
        setTimeout(()=>{
          if (role === 'teacher') location.href = 'teacher/dashboard.html';
          else location.href = 'student/dashboard.html';
        },900);

      } catch (err) {
        show('Unable to reach server', 'error-msg');
      }
    });

    // password visibility toggles for register
      // No password toggle logic needed; icons are static
  }
});
