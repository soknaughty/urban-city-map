export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-2">Welcome to your central management workspace.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder Statistic Cards */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Maps</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Markers</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">New Submissions</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
      </div>
    </div>
  );
}