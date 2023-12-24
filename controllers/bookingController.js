const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const {
  createOne,
  getOne,
  getAll,
  updateOne,
  deleteOne,
} = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: [
        'IN',
        'US',
        'CA',
        'GB' /* other countries where you have customers */,
      ],
    },
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${tour.name} Tour`,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
            description: tour.summary,
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    // NOTE: Not a secure way to do this. Use a webhook instead
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
  });
  // 3) Send it to client
  res.status(200).json({ status: 'success', session });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // FIXME: This is only temporary, because it's unsecure: everyone can make bookings without paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   // NOTE: The reason why we are redirecting to the same page using the originalUrl is because we don't want to show the query string in the URL
//   // NOTE: originalUrl is the URL before the query string (this is used because the request might be from the template or from the API)
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  // NOTE: The reason why we set the client_reference_id to the tour id is because we need to know which tour the user booked
  const tour = session.client_reference_id;
  // NOTE: The reason why session.customer_email is used is because we need to know which user booked the tour
  const user = (await User.findOne({ email: session.customer_email })).id;
  // NOTE: The amount_total is in paisa (1/100 of the currency) that is why we are dividing it by 100
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  // NOTE: Getting the signature from the headers
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = createOne(Booking);

exports.getBooking = getOne(Booking);

exports.getAllBookings = getAll(Booking);

exports.updateBooking = updateOne(Booking);

exports.deleteBooking = deleteOne(Booking);
