import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';

const stripePromise = loadStripe('pk_test_....'); // Replace with your actual publishable key

const CREATE_PAYMENT_INTENT = gql`
  mutation createPaymentIntent($amount: Int!) {
    createPaymentIntent(amount: $amount) {
      clientSecret
    }
  }
`;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [createPaymentIntent, { data, loading, error }] = useMutation(CREATE_PAYMENT_INTENT);
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    try {
      const { data } = await createPaymentIntent({ variables: { amount: 1000 } }); // Replace with actual amount
      const clientSecret = data.createPaymentIntent.clientSecret;

      const payload = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (payload.error) {
        setProcessing(false);
        console.error(payload.error.message);
      } else {
        setSucceeded(true);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error during payment:', error);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || processing || succeeded}>
        {processing ? 'Processing...' : 'Pay'}
      </button>
      {error && <div>{error.message}</div>}
    </form>
  );
};

const Checkout = () => (
  <Elements stripe={stripePromise}>
    <CheckoutForm />
  </Elements>
);

export default Checkout;
