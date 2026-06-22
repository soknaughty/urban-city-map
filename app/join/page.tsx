'use client';

import { useState } from 'react';

export default function JointIntakePage() {
  const [userType, setUserType] = useState<'advertiser' | 'distributor'>('advertiser');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">City Paws Map</h1>
          <p className="text-gray-500">Join our network and manage your map data.</p>
        </header>

        <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setUserType('advertiser')}
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              userType === 'advertiser' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Advertiser Intake
          </button>
          <button
            onClick={() => setUserType('distributor')}
            type="button"
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              userType === 'distributor' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Distributor Intake
          </button>
        </div>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name / Business Name</label>
            <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Target City / Region</label>
            <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div className="pt-4">
            <button type="button" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Submit {userType === 'advertiser' ? 'Advertiser' : 'Distributor'} Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}