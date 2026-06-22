export default function TenantMapPage({ 
  params 
}: { 
  params: { tenant: string } 
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900 capitalize">
          {params.tenant} Map
        </h1>
        <p className="text-lg text-gray-600 mt-4">
          Public-facing map instance for tenant: <span className="font-mono bg-gray-100 p-1 rounded">{params.tenant}</span>
        </p>
        <p className="text-sm text-gray-500 mt-6">
          (The interactive map component and markers will be injected here)
        </p>
      </div>
    </div>
  );
}