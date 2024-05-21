import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import './styles.css';
import axios from 'axios';

/**
 * Define UserList, a React component of CS142 project #5
 */
class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      error: null,
    };
  }

  componentDidMount() {
    axios.get('/user/list')
      .then(response => {
        this.setState({ users: response.data });
      })
      .catch(error => {
        this.setState({ error: error.response.data || 'Failed to fetch users' });
      });
  }

  renderError() {
    const { error } = this.state;
    if (error) {
      return <Typography color="error">{error}</Typography>;
    }
    return null;
  }

  render() {
    return (
      <div>
        {this.renderError()}
        <List component="nav">
          {this.state.users.map(user => (
            <ListItem divider={true} key={user._id}>
              <Link to={`/users/${user._id}`} className="user-list-item">
                <ListItemText primary={`${user.first_name} ${user.last_name}`} />
              </Link>
            </ListItem>
          ))}
        </List>
      </div>
    );
  }
}

export default UserList;
