// components/LoginRegister.js
import React, { Component } from 'react';
import axios from 'axios';

class LoginRegister extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loginName: '',
      errorMessage: '',
    };
  }

  handleLogin = () => {
    axios.post('/admin/login', { login_name: this.state.loginName })
      .then(response => {
        this.props.setCurrentUser(response.data);
      })
      .catch(error => {
        this.setState({ errorMessage: 'Invalid login name. Please try again.' });
      });
  };

  handleInputChange = (event) => {
    this.setState({ loginName: event.target.value });
  };

  render() {
    return (
      <div>
        <h2>Login</h2>
        <input
          type="text"
          value={this.state.loginName}
          onChange={this.handleInputChange}
          placeholder="Login Name"
        />
        <button onClick={this.handleLogin}>Login</button>
        {this.state.errorMessage && <div>{this.state.errorMessage}</div>}
      </div>
    );
  }
}

export default LoginRegister;
