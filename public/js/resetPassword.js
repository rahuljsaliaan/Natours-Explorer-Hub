import axios from 'axios';
import { showAlert } from './alert';

export const resetPassword = async (data, token) => {
  try {
    if (!token) {
      location.assign('/');
      return showAlert('error', 'Invalid token');
    }

    const response = await axios({
      method: 'PATCH',
      url: `/api/v1/users/resetPassword/${token}`,
      data,
    });

    if (response.data.status === 'success') {
      showAlert('success', 'Password reset successfully!');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error?.response?.data?.message || error.message);
  }
};
