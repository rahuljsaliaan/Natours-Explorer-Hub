import axios from 'axios';
import { showAlert } from './alert';

export const forgotPassword = async (data) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `http://127.0.0.1:3000/forgotPassword`,
      data,
    });

    if (response.data.status === 'success') {
      showAlert('success', 'Password reset link sent to your email!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error?.response?.data?.message || error.message);
  }
};
