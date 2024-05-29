import React from 'react';
import { List, ListItem, TextField, Button, Typography, IconButton } from '@material-ui/core';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DeleteIcon from '@material-ui/icons/Delete';
import FavoriteIcon from '@material-ui/icons/Favorite'; // Import like icon
import './styles.css';

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
    this.handleLikeClick = this.handleLikeClick.bind(this);
    this.handleDeleteComment = this.handleDeleteComment.bind(this);
    this.handleDeletePhoto = this.handleDeletePhoto.bind(this);
    this.fetchPhotos = this.fetchPhotos.bind(this);
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

  handleLikeClick(photoId) {
    const userId = this.props.user._id; // Replace with the actual current user ID
    console.log(`Liking photo: ${photoId} by user: ${userId}`);
    axios.post(`/like/${photoId}`, { user_id: userId })
      .then(response => {
        console.log('Like response:', response);
        this.fetchPhotos(); // Refresh photos to include the updated likes
      })
      .catch(error => {
        console.error('Error liking photo:', error);
      });
  }

  handleDeleteComment(commentId, photoId) {
    axios.post(`/deleteComment/${commentId}`, { photo_id: photoId })
      .then(response => {
        this.fetchPhotos(); // Refresh photos to remove the deleted comment
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
      });
  }

  handleDeletePhoto(photoId) {
    axios.post(`/deletePhoto/${photoId}`)
      .then(response => {
        this.fetchPhotos(); // Refresh photos to remove the deleted photo
      })
      .catch(error => {
        console.error('Error deleting photo:', error);
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
    const { comments, photos } = this.state;
    return (
      <div>
        <List component="div">
          {this.renderError()}
          {photos.map(photo => (
            <ListItem divider={false} key={photo._id}>
              <div className="card user-photo-image">
                <img src={"images/" + photo.file_name} className="card-img-top" alt="User" />
                <div className="card-body">
                  <p className="card-title opacity-50 photo-upload-text">
                    {photo.date_time}
                  </p>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => this.handleLikeClick(photo._id)}
                    className="clickable"
                  >
                    <FavoriteIcon />
                    {photo.likes.includes('currentUser') ? 'Unlike' : 'Like'} ({photo.likes.length})
                  </Button>
                  <IconButton
                    aria-label="delete"
                    onClick={() => this.handleDeletePhoto(photo._id)}
                    style={{ visibility: photo.user_id === this.props.user._id ? 'visible' : 'hidden' }}
                  >
                    <DeleteIcon />
                  </IconButton>
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
                          <IconButton
                            aria-label="delete"
                            onClick={() => this.handleDeleteComment(comment._id, photo._id)}
                            style={{ visibility: photo.user_id === this.props.user._id || comment.user._id === this.props.user._id ? 'visible' : 'hidden' }}
                          >
                            <DeleteIcon />
                          </IconButton>
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
