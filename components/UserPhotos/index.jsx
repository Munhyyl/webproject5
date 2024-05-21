import React from 'react';
import { List, ListItem, TextField, Button, Typography } from '@material-ui/core';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

/**
 * Define UserPhotos, a React component of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      comments: {}, // Object to store comments for each photo
      error: null,
    };
    this.handleCommentChange = this.handleCommentChange.bind(this);
    this.handleAddComment = this.handleAddComment.bind(this);
  }

  componentDidMount() {
    this.fetchPhotos();
  }

  componentDidUpdate(prevProps) {
    const userId = this.props.match.params.userId;
    if (userId !== prevProps.match.params.userId) {
      this.fetchPhotos();
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

  handleCommentChange(event, photoId) {
    const comments = { ...this.state.comments };
    comments[photoId] = event.target.value;
    this.setState({ comments });
  }

  handleAddComment(photoId) {
    const commentText = this.state.comments[photoId];
    if (!commentText || !commentText.trim()) {
      return;
    }
    axios.post(`/commentsOfPhoto/${photoId}`, { comment: commentText })
      .then(response => {
        this.fetchPhotos(); // Refresh photos to include the new comment
        const comments = { ...this.state.comments };
        comments[photoId] = ''; // Clear the comment text for the photo
        this.setState({ comments });
      })
      .catch(error => {
        console.error('Error adding comment:', error);
      });
  }

  renderError() {
    const { error } = this.state;
    if (error) {
      return <Typography variant="body1">{error}</Typography>;
    }
    return null;
  }

  render() {
    const { comments } = this.state;
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
                  <TextField
                    label="Add a comment"
                    value={comments[photo._id] || ''}
                    onChange={(event) => this.handleCommentChange(event, photo._id)}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => this.handleAddComment(photo._id)}
                  >
                    Add Comment
                  </Button>
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
