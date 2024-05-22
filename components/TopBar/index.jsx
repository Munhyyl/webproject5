import React, { Component } from 'react';
import { AppBar, Toolbar, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

class TopBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      version: null,
      showUploadDialog: false,
      selectedFile: null,
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

  handleUploadDialogOpen = () => {
    this.setState({ showUploadDialog: true });
  };

  handleUploadDialogClose = () => {
    this.setState({ showUploadDialog: false, selectedFile: null });
  };

  handleFileChange = (event) => {
    this.setState({ selectedFile: event.target.files[0] });
  };

  handleFileUpload = () => {
    const { selectedFile } = this.state;
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);

    axios.post('/photos/new', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(response => {
      this.handleUploadDialogClose();
      alert('Photo uploaded successfully');
      if (this.props.onPhotoUpload) {
        this.props.onPhotoUpload();
      }
    })
    .catch(error => {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    });
  };

  render() {
    const { user } = this.props;
    const { version, showUploadDialog } = this.state;

    const context = user ? (
      <>
        <Typography variant="h6" color="inherit" style={{ marginLeft: 'auto' }}>
          Hi {user.first_name}
        </Typography>
        <Button color="inherit" onClick={this.handleUploadDialogOpen} style={{ marginLeft: '10px' }}>
          Add Photo
        </Button>
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
        <Dialog open={showUploadDialog} onClose={this.handleUploadDialogClose}>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Select a photo to upload.
            </DialogContentText>
            <input type="file" onChange={this.handleFileChange} />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleUploadDialogClose} color="primary">
              Cancel
            </Button>
            <Button onClick={this.handleFileUpload} color="primary">
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </AppBar>
    );
  }
}

export default withRouter(TopBar);
