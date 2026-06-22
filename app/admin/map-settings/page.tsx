'use client';

export default function MapSettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Map Configuration</h1>
        <p className="text-gray-500 mt-2">Customize the visual style and default behavior of your public-facing map.</p>
      </header>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-w-2xl">
        <form className="space-y-6">
          {/* Map Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Map Style</label>
            <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white">
              <option>Streets</option>
              <option>Satellite</option>
              <option>Light Mode</option>
              <option>Dark Mode</option>
            </select>
          </div>

          {/* Default Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Default Latitude</label>
              <input 
                type="text" 
                placeholder="e.g., 40.7128" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Default Longitude</label>
              <input 
                type="text" 
                placeholder="e.g., -74.0060" 
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button 
              type="button" 
              className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}