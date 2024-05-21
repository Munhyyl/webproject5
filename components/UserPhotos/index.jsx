import React from 'react';
import { List, ListItem, ListItemText } from '@material-ui/core';
import { Link } from 'react-router-dom';
import './styles.css';
import axios from 'axios';
import TopBar from '../TopBar/index.jsx';

/**
 * Define UserPhotos, a React component of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      error: null,
    };
  }

  componentDidMount() {
    this.fetchPhotos();
    this.fetchUserDetails();
  }

  componentDidUpdate(prevProps) {
    const userId = this.props.match.params.userId;
    if (userId !== prevProps.match.params.userId) {
      this.fetchPhotos();
      this.fetchUserDetails();
    }
  }

  fetchPhotos() {
    const userId = this.props.match.params.userId;
    axios.get(`/photosOfUser/${userId}`)
      .then(response => {
        this.setState({ photos: response.data });
      })
      .catch(error => {
        this.setState({ error: error.response.data || 'Failed to fetch photos' });
      });
  }

  fetchUserDetails() {
    const userId = this.props.match.params.userId;
    axios.get(`/user/${userId}`)
      .then(response => {
        this.props.setCurrentUser(response.data); // Update the current user in PhotoShare
      })
      .catch(error => {
        console.error('Failed to fetch user details:', error);
      });
  }

  renderError() {
    const { error } = this.state;
    if (error) {
      return <ListItemText primary={error} />;
    }
    return null;
  }

  render() {
    return (
      <div>
        <List component="div">
          {this.renderError()}
          {this.state.photos.map(photo => (
            <ListItem divider={false} key={photo._id}>
              <div className="card user-photo-image">
                <img src={"images/" + photo.file_name} className="card-img-top" alt="User" />
                <div className="card-body">
                  <p className="card-title opacity-50 photo-upload-text">
                    {photo.date_time}
                  </p>
                  <List component="div">
                    {photo.comments && photo.comments.map(comment => (
                      <ListItem divider={false} key={comment._id}>
                        <p className="card-text">
                          <Link to={"/users/" + comment.user._id}>
                            <span className="fw-bold comment-user">
                              {comment.user.first_name + " " + comment.user.last_name + ": "}
                            </span>
                          </Link>
                          <span className="comment-text">
                            {comment.comment}
                          </span>
                          <span className="opacity-50 ms-3 comment-upload-time">
                            (At: {comment.date_time})
                          </span>
                        </p>
                      </ListItem>
                    ))}
                  </List>
                </div>
              </div>
            </ListItem>
          ))}
        </List>
      </div>
    );
  }
}

export default UserPhotos;
