export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900 tracking-tight">Furstops</span>
          <a 
            href="https://join.furstops.com" 
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            Join Network
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl text-center space-y-6">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl">
            The Interactive Map Network for Local Pet Ecosystems
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Connecting premium advertisers and regional distributors into unified, custom-branded mapping experiences.
          </p>
          <div className="pt-4 flex justify-center space-x-4">
            <a 
              href="https://join.furstops.com" 
              className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors"
            >
              Apply as Partner
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Furstops. All rights reserved.
      </footer>
    </div>
  );
}