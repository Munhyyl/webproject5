import React, { Component } from 'react';
import { AppBar, Toolbar, Typography } from '@material-ui/core';
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

  render() {
    const { user } = this.props;
    const { version } = this.state;

    const context = user ? (
      <Typography variant="h6" color="inherit" style={{ marginLeft: 'auto' }}>
        Photos of {user.first_name} {user.last_name}
      </Typography>
    ) : (
      <Typography variant="h6" color="inherit" style={{ marginLeft: 'auto' }}>
        Photo Application
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

export default TopBar;
