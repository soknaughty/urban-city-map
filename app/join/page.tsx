'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// Your live Stripe payment links matching your SKU logic
const STRIPE_LINKS: Record<string, Record<string, string>> = {
  silver_z: { usd: 'https://buy.stripe.com/mock_silver_link' },
  gold_x: { usd: 'https://buy.stripe.com/mock_gold_link' },
  banner: { usd: 'https://buy.stripe.com/mock_banner_link' },
};

function OnboardingManager() {
  const searchParams = useSearchParams();
  const [userType, setUserType] = useState<'advertisers' | 'distributors'>('advertisers');

  // URL Parameter Extraction
  const sku = searchParams.get('sku') || '';
  const category = searchParams.get('category') || '';
  const currency = searchParams.get('currency') || 'usd';

  const normalizedSku = sku.toLowerCase();
  const normalizedCurrency = currency.toLowerCase();
  const isValidSku = normalizedSku in STRIPE_LINKS;
  const isValidCategory = category.length > 0;

  // Shared Form Fields State
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [addressString, setAddressString] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [insiderTip, setInsiderTip] = useState('');
  
  // App Performance State
  const [status, setStatus] = useState<'idle' | 'submitting' | 'redirecting' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-calculate package tiers for advertisers
  let tier = 'silver';
  if (normalizedSku.includes('bnr_wk')) tier = 'banner';
  else if (normalizedSku.endsWith('_x')) tier = 'gold';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setStatusMessage(null);

    try {
      if (userType === 'advertisers') {
        // --- ADVERTISER SUBMISSION ROUTE ---
        const { data, error } = await supabase
          .from('advertisers')
          .insert([
            {
              business_name: businessName,
              address_string: addressString,
              phone: phone || null,
              website_url: websiteUrl || null,
              insider_tip: insiderTip || null,
              tier: tier,
              category: category || 'general',
              is_active: true,
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Fetch generated ID and pass to Stripe checkout routing path
        const advertiserId = data?.id;
        const stripeBaseUrl = STRIPE_LINKS[normalizedSku]?.[normalizedCurrency];
        
        if (!stripeBaseUrl) throw new Error('No matching Stripe checkout link configuration found for this specific plan.');

        const checkoutUrl = new URL(stripeBaseUrl);
        checkoutUrl.searchParams.set('client_reference_id', advertiserId);

        setStatus('redirecting');
        window.location.href = checkoutUrl.toString();

      } else {
        // --- DISTRIBUTOR SUBMISSION ROUTE ---
        const { error } = await supabase
          .from('distributors')
          .insert([
            {
              business_name: businessName,
              address_string: addressString,
              phone: phone || null,
              website_url: websiteUrl || null,
              is_active: false, // Keeping inactive until manually approved in admin dashboard
            }
          ]);

        if (error) throw error;

        setStatus('idle');
        setStatusMessage('Distributor profile successfully submitted! Our team will review your application shortly.');
        
        // Reset fields upon successful distributor signup
        setBusinessName('');
        setEmail('');
        setAddressString('');
        setPhone('');
        setWebsiteUrl('');
      }
    } catch (err: any) {
      setStatusMessage(err?.message || 'An error occurred during verification. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'redirecting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 text-black">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-lg font-semibold text-gray-900">Redirecting to secure checkout…</h2>
          <p className="text-sm text-gray-500">Please wait while we transfer you to Stripe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-black">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">City Paws Map</h1>
          <p className="text-gray-500">Join our network and manage your map data.</p>
        </header>

        {/* Global Multi-Tenant Form Toggle Switch */}
        <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => { setUserType('advertisers'); setStatusMessage(null); }}
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              userType === 'advertisers' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advertiser Intake
          </button>
          <button
            onClick={() => { setUserType('distributors'); setStatusMessage(null); }}
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              userType === 'distributors' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Distributor Intake
          </button>
        </div>

        {/* Notification Feedback Messages Banners */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-lg text-sm border ${
            status === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
          }`}>
            <strong className="block font-semibold">{status === 'error' ? 'Submission failed' : 'Success'}</strong>
            <span>{statusMessage}</span>
          </div>
        )}

        {/* CONDITION 1: ADVERTISER SECURITY FALLBACK ENFORCEMENT */}
        {userType === 'advertisers' && (!isValidSku || !isValidCategory) ? (
          <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-xl">
            <h2 className="text-lg font-bold text-amber-900 mb-1">Invalid Onboarding Link</h2>
            <p className="text-sm text-amber-700">
              Advertiser setup requires specific plan attributes. Please use the personalized payment registration link emailed directly to your company.
            </p>
          </div>
        ) : (
          /* CONDITION 2: ACTIVE FORMS MATRIX RENDERING ENGINE */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {userType === 'advertisers' ? 'Business Name' : 'Company / Distributor Name'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-black" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Email Address <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-black" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Physical Address / Operating Hub Region <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" required value={addressString} onChange={(e) => setAddressString(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-black" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input 
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-black" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Website URL</label>
              <input 
                type="url" placeholder="https://example.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-black" 
              />
            </div>

            {/* CUSTOM UNIQUE FIELD EXCLUSIVE TO ADVERTISERS */}
            {userType === 'advertisers' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Insider Tip / Special Promotion Card Details</label>
                <textarea 
                  rows={4} value={insiderTip} onChange={(e) => setInsiderTip(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-black" 
                />
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit" disabled={status === 'submitting'}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
              >
                {status === 'submitting' ? 'Processing Connection...' : userType === 'advertisers' ? 'Continue to Checkout' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-black">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OnboardingManager />
    </Suspense>
  );
}