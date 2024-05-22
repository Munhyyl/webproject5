import React, { Component } from 'react';
import axios from 'axios';
import { Typography, Grid, FormControl, InputLabel, Input, Button } from "@material-ui/core";

class LoginRegister extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loginName: "",
            password: "",
            newLoginName: "",
            firstName: "",
            lastName: "",
            description: "",
            location: "",
            occupation: "",
            newPassword: "",
            newPassword2: "",
            registeredMessage: "" // Add a state to display messages
        };
    }

    handleLogin = (e) => {
        e.preventDefault(); // Prevent form from refreshing the page
        fetch('/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login_name: this.state.loginName, password: this.state.password })
        }).then(async response => {
            if (response.ok) {
                const user = await response.json();
                this.props.onLogin(user);
            } else {
                console.error('Invalid login name or password');
            }
        });
    };

    getNewUser() {
        const newUser = {
            login_name: this.state.newLoginName,
            password: this.state.newPassword,
            first_name: this.state.firstName,
            last_name: this.state.lastName,
            location: this.state.location,
            description: this.state.description,
            occupation: this.state.occupation
        };
        return newUser;
    }

    handleRegisterSubmit = e => {
        e.preventDefault();

        if (this.state.newPassword !== this.state.newPassword2) {
            console.error("The two passwords are NOT the same, please try again");
            this.setState({ registeredMessage: "The two passwords are NOT the same, please try again" });
            return;
        }
        const newUser = this.getNewUser();

        axios.post("/user", newUser)
            .then(response => {
                console.log("** LoginRegister: new User register Success! **");
                this.setState({
                    registeredMessage: response.data.message,
                    newLoginName: "",
                    newPassword: "",
                    newPassword2: "",
                    firstName: "",
                    lastName: "",
                    location: "",
                    description: "",
                    occupation: ""
                });
            })
            .catch(error => {
                console.error("** LoginRegister: new User loggin Fail! **");
                this.setState({ registeredMessage: error.response.data.message });
            });
    };

    render() {
        return (
            <Grid container>
                {/* Login Form */}
                <Grid container item direction="column" alignItems="center" xs={6}>
                    <Typography variant="h5">Log In</Typography>
                    <Grid item xs={8}>
                        <form onSubmit={this.handleLogin}>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="loginName">Login Name</InputLabel>
                                <Input
                                    id="loginName"
                                    name="loginName"
                                    type="text"
                                    value={this.state.loginName}
                                    onChange={e => this.setState({ loginName: e.target.value })}
                                    required
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="password">Password</InputLabel>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={this.state.password}
                                    onChange={e => this.setState({ password: e.target.value })}
                                    required
                                />
                            </FormControl>
                            <br /><br />
                            <Button type="submit" fullWidth variant="contained" color="primary">Login</Button>
                        </form>
                    </Grid>
                </Grid>

                {/* Register Form */}
                <Grid container item direction="column" alignItems="center" xs={6}>
                    <Typography variant="h5">Create New Account</Typography>
                    <Grid item xs={8}>
                        <form onSubmit={this.handleRegisterSubmit}>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="newLoginName">New Login Name</InputLabel>
                                <Input
                                    id="newLoginName"
                                    name="newLoginName"
                                    type="text"
                                    value={this.state.newLoginName}
                                    onChange={e => this.setState({ newLoginName: e.target.value })}
                                    required
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="firstName">First Name</InputLabel>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={this.state.firstName}
                                    onChange={e => this.setState({ firstName: e.target.value })}
                                    required
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="lastName">Last Name</InputLabel>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={this.state.lastName}
                                    onChange={e => this.setState({ lastName: e.target.value })}
                                    required
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="newPassword">Password</InputLabel>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    value={this.state.newPassword}
                                    onChange={e => this.setState({ newPassword: e.target.value })}
                                    required
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="newPassword2">Confirm Password</InputLabel>
                                <Input
                                    id="newPassword2"
                                    name="newPassword2"
                                    type="password"
                                    value={this.state.newPassword2}
                                    onChange={e => this.setState({ newPassword2: e.target.value })}
                                    required
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="location">Location</InputLabel>
                                <Input
                                    id="location"
                                    name="location"
                                    type="text"
                                    value={this.state.location}
                                    onChange={e => this.setState({ location: e.target.value })}
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="description">Description</InputLabel>
                                <Input
                                    id="description"
                                    name="description"
                                    type="text"
                                    value={this.state.description}
                                    onChange={e => this.setState({ description: e.target.value })}
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel htmlFor="occupation">Occupation</InputLabel>
                                <Input
                                    id="occupation"
                                    name="occupation"
                                    type="text"
                                    value={this.state.occupation}
                                    onChange={e => this.setState({ occupation: e.target.value })}
                                />
                            </FormControl>
                            <br /><br />
                            <Button type="submit" fullWidth variant="contained" color="primary">Register</Button>
                        </form>
                        <Typography variant="body1">{this.state.registeredMessage}</Typography> {/* Display the message */}
                    </Grid>
                </Grid>
            </Grid>
        );
    }
}

export default LoginRegister;
