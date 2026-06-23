'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function RootLandingPage() {
  const [userType, setUserType] = useState<'advertisers' | 'distributors'>('advertisers');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [addressString, setAddressString] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const { error } = await supabase
        .from(userType)
        .insert([
          {
            business_name: businessName,
            address_string: addressString,
            // If your tables have an email column, uncomment the line below:
            // email: email,
          }
        ]);

      if (error) throw error;

      setStatus({ 
        type: 'success', 
        message: 'Your application has been received successfully!' 
      });
      
      setBusinessName('');
      setEmail('');
      setAddressString('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">City Paws Map</h1>
          <p className="text-gray-500">Join our network and manage your map data.</p>
        </header>

        {/* Form Type Toggle */}
        <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setUserType('advertisers')}
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              userType === 'advertisers' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advertiser Intake
          </button>
          <button
            onClick={() => setUserType('distributors')}
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              userType === 'distributors' 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Distributor Intake
          </button>
        </div>

        {/* Status Message Notification banner */}
        {status.type && (
          <div className={`mb-6 p-4 rounded-lg text-sm border ${
            status.type === 'success' 
              ? 'bg-green-50 text-green-800 border-green-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {status.message}
          </div>
        )}

        {/* Interactive Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name / Business Name</label>
            <input 
              type="text" 
              required 
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Target City / Region</label>
            <input 
              type="text" 
              required 
              value={addressString}
              onChange={(e) => setAddressString(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black bg-white" 
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
            >
              {loading ? 'Submitting...' : `Submit ${userType === 'advertisers' ? 'Advertiser' : 'Distributor'} Application`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}