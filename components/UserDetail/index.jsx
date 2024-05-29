import React from 'react';
import {
  Typography,
  Button,
} from '@material-ui/core';
import './styles.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../TopBar/index.jsx'; // import TopBar component

class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      mostRecentPhoto: null,
      mostCommentedPhoto: null,
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
        const user = response.data;
        this.setState({ user });
        this.fetchUserPhotos(userId);
      })
      .catch(error => {
        this.setState({ error: error.response.data || 'Failed to fetch user details' });
      });
  }

  fetchUserPhotos(userId) {
    axios.get(`/photosOfUser/${userId}`)
      .then(response => {
        const photos = response.data;
        if (photos && photos.length > 0) {
          const mostRecentPhoto = photos.reduce((prev, current) =>
            (new Date(current.date_time) > new Date(prev.date_time)) ? current : prev
          );

          const mostCommentedPhoto = photos.reduce((prev, current) =>
            (current.comments.length > prev.comments.length) ? current : prev
          );

          this.setState({ mostRecentPhoto, mostCommentedPhoto });
        }
      })
      .catch(error => {
        console.error('Failed to fetch user photos:', error);
      });
  }

 // Inside the UserDetail component's render method
 render() {
  const { user, mostRecentPhoto, mostCommentedPhoto, error } = this.state;
  if (error) {
    return <Typography variant="body1">{error}</Typography>;
  }

  return (
    <div className="user-detail">
      <Link to={`/photos/${user._id}`}>
        <Button variant="contained" color="primary">View Photos</Button>
      </Link>
      <Typography variant="h6">{user.first_name} {user.last_name}</Typography>
      <Typography variant="body1">Location: {user.location}</Typography>
      <Typography variant="body1">Occupation: {user.occupation}</Typography>
      {user.description &&
        <Typography variant="body1">Description: {user.description}</Typography>
      }
 
      {mostRecentPhoto &&
        <div>
          <Typography variant="h6">Most Recent Photo:</Typography>
          <Link to={`/photos/${user._id}`}>
          <img src={"images/" + mostRecentPhoto.file_name} alt="Most Recent" className="user-detail-image" /></Link>
          <Typography variant="body1">Date Uploaded: {mostRecentPhoto.date_time}</Typography>
        </div>
      }

      {mostCommentedPhoto &&
        <div>
          <Typography variant="h6">Photo with Most Comments:</Typography>
          <Link to={`/photos/${user._id}`}>
          <img src={"images/" + mostCommentedPhoto.file_name} alt="Most Commented" className="user-detail-image"/></Link>
          <Typography variant="body1">Comments Count: {mostCommentedPhoto.comments.length}</Typography>
        </div>
      }
    </div>
  );
}
}

export default UserDetail;
