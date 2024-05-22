import React, { Component } from 'react';
import axios from 'axios';
import './styles.css';
class LoginRegister extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loginName: '',
      password: '',
      newLoginName: '',
      newPassword: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      location: '',
      description: '',
      occupation: '',
      message: '',
    };
  }

  handleLogin = () => {
    const { loginName, password } = this.state;
    fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_name: loginName, password })
    }).then(async response => {
      if (response.ok) {
        const user = await response.json();
        this.props.onLogin(user); // Assuming onLogin is passed as a prop
      } else {
        this.setState({ message: 'Invalid login name or password' });
      }
    });
  };

  
  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleRegister = () => {
    const { newLoginName, newPassword, confirmPassword, firstName, lastName, location, description, occupation } = this.state;

    if (newPassword !== confirmPassword) {
      this.setState({ message: 'Passwords do not match' });
      return;
    }

    const newUser = {
      login_name: newLoginName,
      password: newPassword,
      first_name: firstName,
      last_name: lastName,
      location,
      description,
      occupation,
    };

    axios.post('/user', newUser)
      .then(response => {
        this.setState({ message: response.data.message });
        this.clearForm();
      })
      .catch(error => {
        this.setState({ message: error.response.data.message });
        
      });
  };

  clearForm = () => {
    this.setState({
      newLoginName: '',
      loginName: '',
      password: '',
      newPassword: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      location: '',
      description: '',
      occupation: '',
    });
  };

  render() {
    const { loginName, password, newLoginName, newPassword, confirmPassword, firstName, lastName, location, description, occupation, message } = this.state;

    return (
      <div>
        <h2>Login</h2>
        <input
          type="text"
          name="loginName"
          placeholder="Login Name"
          value={loginName}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <button onClick={this.handleLogin} className='login-register-button'>Login</button>
        
        <h2>Register</h2>
        <input
          type="text"
          name="newLoginName"
          placeholder="Login Name"
          value={newLoginName}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="password"
          name="newPassword"
          placeholder="Password"
          value={newPassword}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={firstName}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={lastName}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={location}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={description}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <input
          type="text"
          name="occupation"
          placeholder="Occupation"
          value={occupation}
          onChange={this.handleInputChange}
          className='login-register-input'
        />
        <button onClick={this.handleRegister} className='login-register-button'>Register Me</button>
        {message && <p>{message}</p>}
      </div>
    );
  }
}

export default LoginRegister;
