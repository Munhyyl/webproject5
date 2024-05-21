import React, { Component } from 'react';
import { AppBar, Toolbar, Typography, Button } from '@material-ui/core';
import { withRouter } from 'react-router-dom';
import './styles.css';
import axios from 'axios';

class TopBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      version: null
    };
  }

  componentDidMount() {
    const infoUrl = "http://localhost:3000/test/info";
    axios.get(infoUrl)
      .then(response => {
        this.setState({ version: response.data.__v });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  handleLogout = () => {
    axios.post('/admin/logout')
      .then(response => {
        if (response.status === 200) {
          this.props.onLogout();
          this.props.history.push('/login');
        }
      })
      .catch(error => {
        console.error('Error logging out:', error);
      });
  };

  render() {
    const { user } = this.props;
    const { version } = this.state;

    const context = user ? (
      <>
        <Typography variant="h6" color="inherit" style={{ marginLeft: 'auto' }}>
          Hi {user.first_name}
        </Typography>
        <Button color="inherit" onClick={this.handleLogout} style={{ marginLeft: '10px' }}>
          Logout
        </Button>
      </>
    ) : (
      <Typography variant="h6" color="inherit" style={{ marginLeft: 'auto' }}>
        Please Login
      </Typography>
    );

    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar>
          <Typography variant="h5" color="inherit">
            MUnkh-orgil 22b1num1680
          </Typography>
          {context}
          {version && (
            <Typography variant="body1" color="inherit">
              Version: {version}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
    );
  }
}

export default withRouter(TopBar);
