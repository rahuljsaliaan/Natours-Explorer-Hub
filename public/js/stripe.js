import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51OQql1SGoZ3Hf2dnP7TgkPCwttAS9Yv0xQG3vfOnFftNpUO5GgcXzhhkKoo83iv7qihkRx9q2mOhniz0KCbIloa600PTgwpW4e',
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
    });

    // 2) Create checkout form + charge credit card
    const checkout = await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });

    // Mount Checkout
    checkout.mount('#checkout');
  } catch (error) {
    showAlert('error', error?.response?.data?.message || error.message);
  }
};
