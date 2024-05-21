import React from 'react';
import {
  Typography
} from '@material-ui/core';
import './styles.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../TopBar/index.jsx'; // import TopBar component

/**
 * Define UserDetail, a React component of CS142 project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      error: null,
    };
  }

  componentDidMount() {
    this.fetchUserDetails();
  }

  componentDidUpdate(prevProps) {
    const userId = this.props.match.params.userId;
    if (userId !== prevProps.match.params.userId) {
      this.fetchUserDetails();
    }
  }

  fetchUserDetails() {
    const userId = this.props.match.params.userId;
    axios.get(`/user/${userId}`)
      .then(response => {
        this.setState({ user: response.data });
        this.props.setCurrentUser(response.data);
      })
      .catch(error => {
        this.setState({ error: error.response.data || 'Failed to fetch user details' });
      });
  }

  render() {
    const { user, error } = this.state;
    if (error) {
      return <Typography variant="body1">{error}</Typography>;
    }

    return (
      <div className="user-detail">
        <Link to={`/photos/${user._id}`}>
          <button type="button">Photos</button>
        </Link>
        <Typography variant="h6">{user.first_name} {user.last_name}</Typography>
        <Typography variant="body1">Location: {user.location}</Typography>
        <Typography variant="body1">Occupation: {user.occupation}</Typography>
        <Typography variant="body1">Description: {user.description}</Typography>
      </div>
    );
  }
}

export default UserDetail;
