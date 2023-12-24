// update Data

import axios from 'axios';
import { showAlert } from './alert';

export const updateUser = async (data, type = 'data') => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const response = await axios({
      method: 'PATCH',
      url,
      data,
      type: `${type === 'data' ? 'multipart/form-data' : 'application/json'}`,
    });

    if (response.data.status === 'success')
      showAlert(
        'success',
        `${type[0].toLocaleUpperCase() + type.slice(1)} updated successfully!`,
      );

    const {
      data: {
        data: { user },
      },
    } = response;

    return user;
  } catch (error) {
    showAlert('error', error?.response?.data?.message || error.message);
  }
};
