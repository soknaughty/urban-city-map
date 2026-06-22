export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Admin Workspace</h2>
        </div>
        <nav className="mt-4">
          <a href="/admin" className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            Dashboard
          </a>
          <a href="/admin/map-settings" className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            Map Configuration
          </a>
          <a href="/admin/submissions" className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600">
            Intake Submissions
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}