import '@babel/parser';
import { logout } from './login';
import { login } from './login';
import { signup } from './signup';
import { displayMap } from './leaflet';
import { updateUser } from './updateSettings';
import { showAlert } from './alert';

const loginForm = document.querySelector('#form-login');
const signupForm = document.querySelector('#form-signup');
const map = document.querySelector('#map');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserDataForm = document.querySelector('#form-user-data');
const updateUserPasswordForm = document.querySelector('#form-user-password');

// Helper function to get form data
const toCamelCase = (str) => {
  return str.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
};

const getFormData = (form, fields) => {
  return fields.reduce((obj, field) => {
    const element = form.querySelector(`#${field}`);
    const camelCaseField = toCamelCase(field);
    obj[camelCaseField] = element && element.value ? element.value : null;
    return obj;
  }, {});
};

// Helper function to get base64 from file
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { email, password } = getFormData(loginForm, ['email', 'password']);
    login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { name, email, photo, password, confirmPassword } = getFormData(
      signupForm,
      ['name', 'email', 'photo', 'password', 'confirm-password'],
    );
    const base64Photo = await getBase64(photo.files[0]);
    signup({ name, email, photo: base64Photo, password, confirmPassword });
  });
}

if (map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (updateUserDataForm) {
  updateUserDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const { name, email } = getFormData(updateUserDataForm, ['name', 'email']);
    // Assuming updateProfile is a function defined elsewhere

    console.log(name, email);
    updateUser({ name, email });
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
