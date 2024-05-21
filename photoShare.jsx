import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Grid, Paper } from "@mui/material";
import { HashRouter, Route, Switch, Redirect } from "react-router-dom";

import "./styles/main.css";
import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";

class PhotoShare extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null, // State to hold the current user
    };
    this.setCurrentUser = this.setCurrentUser.bind(this);
    this.handlePhotoUpload = this.handlePhotoUpload.bind(this); // Bind the method
  }

  setCurrentUser(user) {
    this.setState({ currentUser: user });
  }

  handlePhotoUpload() {
    
    if (this.userPhotosRef) {
      this.userPhotosRef.fetchPhotos();
    }
    console.log('Photo uploaded. Refreshing photos...');
  }

  render() {
    const { currentUser } = this.state;
    return (
      <HashRouter>
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TopBar user={currentUser} onLogout={() => this.setCurrentUser(null)} onPhotoUpload={this.handlePhotoUpload} /> 
            </Grid>
            <div className="cs142-main-topbar-buffer" />
            <Grid item sm={3}>
              <Paper className="cs142-main-grid-item">
                {currentUser && <UserList />} {/* No need to pass setCurrentUser */}
              </Paper>
            </Grid>
            <Grid item sm={9}>
              <Paper className="cs142-main-grid-item">
                <Switch>
                  <Route path="/login" render={(props) => (
                    <LoginRegister {...props} onLogin={this.setCurrentUser} />
                  )} />
                  <Route path="/users/:userId" render={(props) => (
                    currentUser ? <UserDetail {...props} /> : <Redirect to="/login" />
                  )} />
                  <Route path="/photos/:userId" render={(props) => (
                  <UserPhotos {...props} ref={ref => this.userPhotosRef = ref} onPhotoUpload={this.handlePhotoUpload} />
                  )} />
                  <Route path="/" render={() => (
                    currentUser ? <Redirect to="/users" /> : <Redirect to="/login" />
                  )} />
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(<PhotoShare />, document.getElementById("photoshareapp"));
