'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface GooglePayButtonProps {
  planId: string;
  planName: string;
  priceMonthly: number;
  choirId: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GooglePayButton({
  planId,
  planName,
  priceMonthly,
  choirId,
  onSuccess,
}: GooglePayButtonProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const googlePayMerchantId = process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || '12345678901234567890';
  const googlePayEnv = (process.env.NEXT_PUBLIC_GOOGLE_PAY_ENV as 'TEST' | 'PRODUCTION') || 'TEST';

  useEffect(() => {
    // Dynamically load Google Pay JS SDK if not present
    if (window.google?.payments?.api?.PaymentsClient) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = () => {
      setSdkLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load Google Pay SDK. Please check your network connection.');
    };
    document.body.appendChild(script);
  }, []);

  const getGooglePaymentDataRequest = () => {
    const baseRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
    };

    const allowedCardNetworks = ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'];
    const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

    const tokenizationSpecification = {
      type: 'PAYMENT_GATEWAY',
      parameters: {
        gateway: 'example',
        gatewayMerchantId: 'exampleGatewayMerchantId',
      },
    };

    const baseCardPaymentMethod = {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks,
      },
    };

    const cardPaymentMethod = Object.assign(
      {},
      baseCardPaymentMethod,
      {
        tokenizationSpecification: tokenizationSpecification,
      }
    );

    const transactionInfo = {
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: priceMonthly.toFixed(2),
      currencyCode: 'USD',
      countryCode: 'US',
    };

    const merchantInfo = {
      merchantName: 'Voxify Space Choir SaaS',
      merchantId: googlePayMerchantId,
    };

    return Object.assign({}, baseRequest, {
      allowedPaymentMethods: [cardPaymentMethod],
      transactionInfo: transactionInfo,
      merchantInfo: merchantInfo,
    });
  };

  const handleGooglePayClick = async () => {
    if (!sdkLoaded || !window.google?.payments?.api) {
      setError('Google Pay is initializing. Please try again in a moment.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: googlePayEnv,
      });

      const paymentDataRequest = getGooglePaymentDataRequest();
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      // Extract payment token
      const paymentToken = paymentData?.paymentMethodData?.tokenizationData?.token || 'mock_gpay_token_' + Date.now();

      // Submit token to backend checkout API
      const res = await fetch('/api/payments/google-pay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choirId,
          planId,
          priceMonthly,
          paymentToken,
          paymentMethod: 'google_pay',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Google Pay Payment Verified! ${planName} Plan activated ($${priceMonthly}/mo).`);
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Failed to complete Google Pay transaction.');
      }
    } catch (err: any) {
      if (err?.statusCode === 'CANCELED') {
        // User closed the Google Pay dialog
        setError(null);
      } else {
        console.error('Google Pay error:', err);
        setError(err.message || 'Google Pay transaction failed.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleGooglePayClick}
        disabled={processing || !sdkLoaded}
        className="w-full bg-black hover:bg-slate-900 border border-slate-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01]"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span className="text-xs">Processing Google Pay...</span>
          </>
        ) : (
          <>
            <span className="text-xs font-semibold text-slate-300">Pay ${priceMonthly}/mo with</span>
            {/* Official Google Pay Logo SVG */}
            <svg className="h-6 w-auto" viewBox="0 0 160 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M72.2 27.6v19h-5.2v-27h13.9c3.9 0 7 1.2 9.4 3.7 2.4 2.4 3.6 5.6 3.6 9.4 0 3.9-1.2 7-3.6 9.5-2.4 2.4-5.5 3.6-9.4 3.6H72.2zm0-4.6h8.8c2.4 0 4.4-.8 5.9-2.3 1.5-1.5 2.3-3.5 2.3-6s-.8-4.5-2.3-6c-1.5-1.5-3.5-2.3-5.9-2.3H72.2v16.6z" fill="#FFF"/>
              <path d="M107.5 32.2c-2.4 0-4.3.7-5.8 2.2-1.5 1.5-2.2 3.4-2.2 5.8 0 2.4.7 4.3 2.2 5.8 1.5 1.5 3.4 2.2 5.8 2.2 2.4 0 4.3-.7 5.8-2.2 1.5-1.5 2.2-3.4 2.2-5.8 0-2.4-.7-4.3-2.2-5.8-1.5-1.5-3.4-2.2-5.8-2.2zm-12.7 8c0-3.7 1.2-6.7 3.6-9.1 2.4-2.4 5.5-3.6 9.1-3.6 3.6 0 6.7 1.2 9.1 3.6 2.4 2.4 3.6 5.4 3.6 9.1 0 3.7-1.2 6.7-3.6 9.1-2.4 2.4-5.5 3.6-9.1 3.6-3.6 0-6.7-1.2-9.1-3.6-2.4-2.4-3.6-5.4-3.6-9.1z" fill="#FFF"/>
              <path d="M149.3 27.8l-12.4 28.5h-5.4l4.6-10.3-8.2-18.2h5.7l5.1 12.4 5-12.4h5.6z" fill="#FFF"/>
              <path d="M43.8 27.6c.9-1.2 1.4-2.6 1.4-4.2 0-3.8-3.1-6.8-6.9-6.8-3.8 0-6.9 3.1-6.9 6.8 0 1.6.5 3 1.4 4.2H43.8z" fill="#EA4335"/>
              <path d="M22.5 32.5c0-1.1.1-2.2.3-3.2H0v6.2h12.9c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.6-4.2 7.2-10.4 7.2-16.2z" fill="#4285F4"/>
              <path d="M10.7 44.5c-3.3 0-6.1-2.2-7-5.3H.7v6.2c3.5 6.9 10.6 11.6 18.8 11.6 4.9 0 9.1-1.6 12.1-4.4l-7.8-6c-2.1 1.4-4.8 2.2-7.4 2.2z" fill="#34A853"/>
              <path d="M3.7 39.2c-.3-1-.5-2.1-.5-3.2s.2-2.2.5-3.2v-6.2H.7C-.5 29.1-1.2 32.5-1.2 36s.7 6.9 1.9 9.4l3-6.2z" fill="#FBBC05"/>
              <path d="M10.7 20.5c2.7 0 5.1 1 7 2.7l5.2-5.2C19.7 15 15.5 13 10.7 13 2.5 13-4.6 17.7-8.1 24.6l7 6.2c.9-3.1 3.7-5.3 7-5.3z" fill="#EA4335"/>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
