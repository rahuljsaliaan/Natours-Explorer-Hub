/*eslint-disable*/
const signup = async (formData) => {
  try {
    const response = await axios({
      method: 'post',
      url: 'http://127.0.0.1:3000/api/v1/users/signup',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.data.status === 'success') {
      alert('Signed up successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (error) {
    // handle error
    console.log(error.response.data);
  }
};

document.querySelector('.form').addEventListener('submit', function (e) {
  e.preventDefault();

  let name = document.querySelector('#name').value;
  let email = document.querySelector('#email').value;
  let photo = document.querySelector('#photo').files[0];
  let password = document.querySelector('#password').value;
  let confirmPassword = document.querySelector('#confirm-password').value;

  let formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('photo', photo);
  formData.append('password', password);
  formData.append('confirmPassword', confirmPassword);

  signup(formData);
});
