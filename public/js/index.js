import '@babel/parser';
import { login } from './login';
import { signup } from './signup';
import { displayMap } from './leaflet';

const loginForm = document.querySelector('#form-login');

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });

const signupForm = document.querySelector('#form-signup');

if (signupForm)
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let name = document.querySelector('#name').value;
    let email = document.querySelector('#email').value;
    let photo = document.querySelector('#photo').files[0];
    let password = document.querySelector('#password').value;
    let confirmPassword = document.querySelector('#confirm-password').value;

    function getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    }

    // Usage:
    getBase64(photo).then((base64Photo) => {
      let data = {
        name: name,
        email: email,
        photo: base64Photo,
        password: password,
        confirmPassword: confirmPassword,
      };

      signup(data); // Assuming signup is a function defined elsewhere
    });
  });

const map = document.querySelector('#map');

if (map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}
