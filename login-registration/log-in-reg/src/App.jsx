import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('Student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [college, setCollege] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        identifier,
        password
      });
      alert('Login successful!');
      console.log('Server response:', response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed!');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        role,
        fullName,
        studentId: role === 'Student' ? studentId : null,
        college: role === 'Student' ? college : null,
        email,
        password
      });
      alert('Account created successfully!');
      setIsLogin(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed!');
    }
  };

  return (
    <div className="auth">
      {/* Left Brand Panel */}
      <aside className="auth__brand">
        <div className="auth__seal">
          <img src="/wmsu-seal.png" alt="Western Mindanao State University seal" />
        </div>
        <h1 className="auth__system">Campus Equipment<br />Borrowing System</h1>
        <p className="auth__tagline">Request equipment, track due dates, and return items on time, all in one place.</p>
        <p className="auth__school">Western Mindanao State University</p>
      </aside>

      {/* Right Form Panel */}
      <main className="auth__panel">
        <div className="auth__card">
          <img className="auth__seal-sm" src="/wmsu-seal.png" alt="" aria-hidden="true" />

          {isLogin ? (
            /* --- LOGIN VIEW --- */
            <div>
              <h2 className="auth__title">Log in</h2>
              <p className="auth__subtitle">Use your school email or ID number to borrow and track equipment.</p>

              <form onSubmit={handleLogin}>
                <div className="field">
                  <label htmlFor="identifier">School email or ID number</label>
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <div className="pw">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="pw__toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn">Log in</button>
              </form>

              <p className="auth__footer">
                New here?{' '}
                <button
                  type="button"
                  className="link"
                  onClick={() => setIsLogin(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Create an account
                </button>
              </p>
            </div>
          ) : (
            /* --- REGISTER VIEW --- */
            <div>
              <h2 className="auth__title">Create your account</h2>
              <p className="auth__subtitle">Register once to request equipment from the campus inventory.</p>

              {/* Student / Staff Role Selector Segmented Control */}
              <fieldset className="seg">
                <legend>Role</legend>
                <div
                  className={`seg__opt ${role === 'Student' ? 'is-on' : ''}`}
                  onClick={() => setRole('Student')}
                >
                  Student
                </div>
                <div
                  className={`seg__opt ${role === 'Staff' ? 'is-on' : ''}`}
                  onClick={() => setRole('Staff')}
                >
                  Staff
                </div>
              </fieldset>

              <form onSubmit={handleRegister}>
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {role === 'Student' && (
                  <div className="grid2">
                    <div className="field">
                      <label htmlFor="studentId">Student ID</label>
                      <input
                        type="text"
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="college">College</label>
                      <input
                        type="text"
                        id="college"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid2">
                  <div className="field">
                    <label htmlFor="regPassword">Password</label>
                    <div className="pw">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="regPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="pw__toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <div className="pw">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="pw__toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn" style={{ marginTop: '1rem' }}>Create account</button>
              </form>

              <p className="auth__footer">
                Already have an account?{' '}
                <button
                  type="button"
                  className="link"
                  onClick={() => setIsLogin(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Log in
                </button>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;