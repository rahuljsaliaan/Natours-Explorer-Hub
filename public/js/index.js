import '@babel/parser';
import { logout } from './login';
import { login } from './login';
import { signup } from './signup';
import { displayMap } from './leaflet';
import { updateUser } from './updateSettings';
import { showAlert } from './alert';
import { resetPassword } from './resetPassword';
import { forgotPassword } from './forgotPassword';

const loginForm = document.querySelector('#form-login');
const signupForm = document.querySelector('#form-signup');
const map = document.querySelector('#map');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserDataForm = document.querySelector('#form-user-data');
const updateUserPasswordForm = document.querySelector('#form-user-password');
const resetPasswordForm = document.querySelector('#form-reset-password');
const btnForgotPassword = document.querySelector('#btn-forgot-password');

// Helper function to convert kebab-case to camelCase
const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
};

// Helper function to get form data
const getFormData = (form, fields) => {
  return fields.reduce((obj, field) => {
    const element = form.querySelector(`#${field}`);
    const camelCaseField = toCamelCase(field);
    obj[camelCaseField] = element && element.value ? element.value : null;
    return obj;
  }, {});
};

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email, password } = getFormData(loginForm, ['email', 'password']);

    const btnLogin = document.querySelector('#btn-login');

    btnLogin.textContent = 'Loading...';
    await login(email, password);

    btnLogin.textContent = 'Login';
  });
}

if (btnForgotPassword) {
  btnForgotPassword.addEventListener('click', async (e) => {
    e.preventDefault();

    const { email } = getFormData(loginForm, ['email']);

    if (!email) return showAlert('error', 'Please enter your email address');

    const btnForgotPassword = document.querySelector('#btn-forgot-password');

    btnForgotPassword.textContent = 'Loading...';

    await forgotPassword({ email });
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { name, email, password, passwordConfirm } = getFormData(signupForm, [
      'name',
      'email',
      'password',
      'password-confirm',
    ]);

    if (password !== passwordConfirm) {
      return showAlert('error', 'Passwords do not match!');
    }
    const btnSignup = document.querySelector('#btn-signup');

    btnSignup.textContent = 'Loading...';

    await signup({ name, email, password, passwordConfirm });

    btnSignup.textContent = 'Sign up';
  });
}

if (map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (updateUserDataForm) {
  updateUserDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();

    const photoImg = updateUserDataForm.querySelector('#photo-img');

    const { name, email } = getFormData(updateUserDataForm, ['name', 'email']);

    const photo = document.querySelector('#photo').files[0];

    form.append('name', name);
    form.append('email', email);
    form.append('photo', photo);

    // Assuming updateProfile is a function defined elsewhere
    const user = await updateUser(form);
    photoImg.src = `/img/users/${user.photo}`;
  });
}

if (updateUserPasswordForm) {
  updateUserPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { currentPassword, password, passwordConfirm } = getFormData(
      updateUserPasswordForm,
      ['current-password', 'password', 'password-confirm'],
    );

    if (password !== passwordConfirm) {
      return showAlert(
        'error',
        'New password and confirm password do not match',
      );
    }

    const btnSavePassword = document.querySelector('#btn-save-password');

    btnSavePassword.textContent = 'Updating...';

    await updateUser(
      { currentPassword, password, passwordConfirm },
      'password',
    );

    btnSavePassword.textContent = 'Save password';

    updateUserPasswordForm.reset();
  });
}

if (resetPasswordForm) {
  const token = resetPasswordForm.dataset.token;

  if (!token) {
    location.assign('/');
    return showAlert('error', 'Invalid token');
  }

  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { password, passwordConfirm } = getFormData(resetPasswordForm, [
      'password',
      'password-confirm',
    ]);

    if (password !== passwordConfirm) {
      return showAlert('error', 'Passwords do not match');
    }

    const btnSavePassword = document.querySelector('#btn-save-password');

    btnSavePassword.textContent = 'Updating...';

    await resetPassword({ password, passwordConfirm }, token);

    btnSavePassword.textContent = 'Save password';
  });
}
