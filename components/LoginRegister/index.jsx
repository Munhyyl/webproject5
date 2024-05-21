import React, { useState } from 'react';

function LoginRegister({ onLogin }) {
    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login_name: loginName, password })
        }).then(async response => {
            if (response.ok) {
                const user = await response.json();
                onLogin(user);
            } else {
                setError('Invalid login name or password');
            }
        });
    };

    return (
        <div className="login-register">
            <input
                type="text"
                placeholder="Login Name"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default LoginRegister;