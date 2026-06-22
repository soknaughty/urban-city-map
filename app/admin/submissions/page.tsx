export default function SubmissionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Intake Submissions</h1>
        <p className="text-gray-500 mt-2">Review and manage incoming map data from advertisers and distributors.</p>
      </header>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider font-bold">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Empty state placeholder */}
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                No submissions found. Your queue for advertisers and distributors is currently empty.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}