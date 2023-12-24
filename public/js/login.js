/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

// Login User
export const login = async (email, password) => {
  try {
    const response = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
      withCredentials: true,
    });

    if (response.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        // location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message || error.message);
  }
};

export const logout = async () => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    if (response.data.status === 'success') {
      location.assign('/');
    }
  } catch (error) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
