'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const STRIPE_LINKS: Record<string, string> = {
  silver_z: 'https://buy.stripe.com/mock_silver_link',
  gold_x: 'https://buy.stripe.com/mock_gold_link',
  banner: 'https://buy.stripe.com/mock_banner_link',
};

export default function AdminOnboardingPortal() {
  const [userType, setUserType] = useState<'advertisers' | 'distributors'>('advertisers');
  
  // Internal Selectors exclusive to Admin
  const [selectedSku, setSelectedSku] = useState('silver_z');
  const [category, setCategory] = useState('groomer');

  // Core Fields
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [addressString, setAddressString] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [insiderTip, setInsiderTip] = useState('');

  // UI Processing State
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string; stripeLink?: string }>({ type: null, message: '' });

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: null, message: '' });

    // Derive tier string from your custom SKU selection
    let tier = 'silver';
    if (selectedSku.includes('bnr_wk') || selectedSku === 'banner') tier = 'banner';
    else if (selectedSku.endsWith('_x')) tier = 'gold';

    try {
      if (userType === 'advertisers') {
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
              category: category,
              is_active: true,
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Generate the unique checkout link for this specific customer
        const stripeBase = STRIPE_LINKS[selectedSku];
        const clientCheckoutUrl = `${stripeBase}?client_reference_id=${data.id}`;

        setFeedback({
          type: 'success',
          message: `Advertiser "${businessName}" successfully provisioned in database!`,
          stripeLink: clientCheckoutUrl
        });

      } else {
        const { error } = await supabase
          .from('distributors')
          .insert([
            {
              business_name: businessName,
              address_string: addressString,
              phone: phone || null,
              website_url: websiteUrl || null,
              is_active: true, // Auto-approve since you are creating this yourself
            }
          ]);

        if (error) throw error;

        setFeedback({
          type: 'success',
          message: `Distributor "${businessName}" has been successfully added to your network.`
        });
      }

      // Reset text inputs upon success
      setBusinessName('');
      setEmail('');
      setAddressString('');
      setPhone('');
      setWebsiteUrl('');
      setInsiderTip('');

    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Database write operation failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Manual Partner Onboarding</h1>
          <p className="text-gray-400 mt-1">Direct administrative portal for provisioning network entities.</p>
        </div>

        {/* System Tab Toggle */}
        <div className="flex bg-gray-900 p-1 rounded-xl w-72 border border-gray-800">
          <button
            type="button" onClick={() => { setUserType('advertisers'); setFeedback({ type: null, message: '' }); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${userType === 'advertisers' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Add Advertiser
          </button>
          <button
            type="button" onClick={() => { setUserType('distributors'); setFeedback({ type: null, message: '' }); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${userType === 'distributors' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Add Distributor
          </button>
        </div>

        {/* Feedback Banners */}
        {feedback.type && (
          <div className={`p-5 rounded-xl border ${feedback.type === 'error' ? 'bg-red-950/50 border-red-800 text-red-200' : 'bg-emerald-950/50 border-emerald-800 text-emerald-200'}`}>
            <h3 className="font-bold text-base mb-1">{feedback.type === 'error' ? 'Operation Failed' : 'Success'}</h3>
            <p className="text-sm opacity-90">{feedback.message}</p>
            
            {feedback.stripeLink && (
              <div className="mt-4 p-3 bg-gray-900 border border-gray-800 rounded-lg flex flex-col space-y-2">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Client Payment Link:</span>
                <input type="text" readOnly value={feedback.stripeLink} className="w-full bg-black text-blue-400 text-xs px-2 py-1.5 rounded border border-gray-800 select-all focus:outline-none" />
                <p className="text-xs text-gray-400">Copy this complete URL sequence and email it to your advertiser client to initiate payment.</p>
              </div>
            )}
          </div>
        )}

        {/* Main Entry Matrix Form */}
        <form onSubmit={handleAdminSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
          
          {/* Admin Selectors Configuration Panel */}
          {userType === 'advertisers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/40 rounded-xl border border-gray-800">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Target Package / SKU</label>
                <select value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white">
                  <option value="silver_z">Silver Tier (silver_z)</option>
                  <option value="gold_x">Gold Tier (gold_x)</option>
                  <option value="banner">Banner Placement (banner)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Map Display Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white">
                  <option value="groomer">Groomer</option>
                  <option value="vet">Veterinary Clinic</option>
                  <option value="dining">Dog Friendly Dining</option>
                  <option value="retail">Pet Retail Stores</option>
                </select>
              </div>
            </div>
          )}

          {/* Standard Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Entity Name <span className="text-red-500">*</span></label>
              <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Contact Email Address <span className="text-red-500">*</span></label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300">Full Physical Address / Region String <span className="text-red-500">*</span></label>
            <input type="text" required value={addressString} onChange={(e) => setAddressString(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Website URL</label>
              <input type="url" placeholder="https://" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white" />
            </div>
          </div>

          {userType === 'advertisers' && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Insider Tip / Special Promotion Card Details</label>
              <textarea rows={4} value={insiderTip} onChange={(e) => setInsiderTip(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 px-3.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-white" />
            </div>
          )}

          <div className="pt-4 border-t border-gray-800">
            <button
              type="submit" disabled={loading}
              className="w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:bg-blue-800 transition-colors"
            >
              {loading ? 'Executing Engine Writes...' : `Provision New ${userType === 'advertisers' ? 'Advertiser Account' : 'Distributor Entity'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}