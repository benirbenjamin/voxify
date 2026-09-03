'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Globe, CreditCard } from 'lucide-react';
import { currencyService, SupportedCurrency } from '@/lib/services/currencyService';

interface FlutterwaveButtonProps {
  planId: string;
  planName: string;
  usdAmount: number;
  monthsCount: number;
  choirId: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: any;
  }
}

export function FlutterwaveButton({
  planId,
  planName,
  usdAmount,
  monthsCount,
  choirId,
  userEmail,
  userName,
  onSuccess,
}: FlutterwaveButtonProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<SupportedCurrency, number>>({
    USD: 1.0, RWF: 1350, UGX: 3700, KES: 130, NGN: 1500,
  });
  const [convertedAmount, setConvertedAmount] = useState<number>(usdAmount);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const flutterwavePublicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '01d4d3c3-9892-4f25-bd5b-2ec07a4003c3';

  useEffect(() => {
    // Load Flutterwave inline SDK
    if (window.FlutterwaveCheckout) {
      setSdkLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => setSdkLoaded(true);
      script.onerror = () => setError('Failed to load Flutterwave checkout script.');
      document.body.appendChild(script);
    }

    // Load live exchange rates
    async function fetchRates() {
      const rates = await currencyService.getExchangeRates();
      setExchangeRates(rates);
    }
    fetchRates();
  }, []);

  useEffect(() => {
    const rate = exchangeRates[currency] || 1.0;
    const calc = currencyService.convertAmount(usdAmount, currency, rate);
    setConvertedAmount(calc);
  }, [currency, usdAmount, exchangeRates]);

  const handleFlutterwavePayment = () => {
    if (!sdkLoaded || !window.FlutterwaveCheckout) {
      setError('Flutterwave gateway loading. Please try again in a moment.');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMsg(null);

    const txRef = `VXF-${choirId.substring(0, 5)}-${Date.now()}`;
    const currencyMeta = currencyService.getCurrencyMeta(currency);

    window.FlutterwaveCheckout({
      public_key: flutterwavePublicKey,
      tx_ref: txRef,
      amount: convertedAmount,
      currency: currency,
      payment_options: 'card, mobilemoneyrwanda, mobilemoneyuganda, mobilemoneyghana, ussd, banktransfer',
      customer: {
        email: userEmail || 'user@voxify.space',
        name: userName || 'Voxify Member',
      },
      customizations: {
        title: `Voxify ${planName} Subscription`,
        description: `Plan renewal for ${monthsCount} Month(s) (${currencyMeta.symbol}${convertedAmount.toLocaleString()})`,
        logo: 'https://voxify.space/icon.png',
      },
      callback: async (response: any) => {
        if (response.status === 'successful' || response.status === 'completed') {
          // Verify on backend
          try {
            const res = await fetch('/api/payments/flutterwave/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId: response.transaction_id,
                txRef: response.tx_ref,
                choirId,
                planId,
                monthsCount,
                chargedAmount: convertedAmount,
                currency,
              }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
              setSuccessMsg(`Payment Verified! ${planName} Plan activated for ${monthsCount} month(s).`);
              if (onSuccess) onSuccess();
            } else {
              setError(data.error || 'Failed to verify transaction on server.');
            }
          } catch (err: any) {
            setError(err.message || 'Error verifying payment.');
          }
        } else {
          setError('Payment was not completed.');
        }
        setProcessing(false);
      },
      onclose: () => {
        setProcessing(false);
      },
    });
  };

  const currencyMeta = currencyService.getCurrencyMeta(currency);

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

      {/* Currency Selector */}
      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
          <Globe className="w-3.5 h-3.5 text-amber-400" /> Select Currency:
        </span>
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value as SupportedCurrency)}
          className="bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="USD">USD ($)</option>
          <option value="RWF">RWF (Rwandan Franc)</option>
          <option value="UGX">UGX (Ugandan Shilling)</option>
          <option value="KES">KES (Kenyan Shilling)</option>
          <option value="NGN">NGN (Nigerian Naira)</option>
        </select>
      </div>

      <button
        type="button"
        onClick={handleFlutterwavePayment}
        disabled={processing || !sdkLoaded}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span className="text-xs">Processing Flutterwave...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 text-slate-950" />
            <span className="text-xs">
              Pay {currencyMeta.symbol}{convertedAmount.toLocaleString()} via Flutterwave
            </span>
          </>
        )}
      </button>
    </div>
  );
}
