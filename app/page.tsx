'use client';

import TenantMapPortal from "./map/[tenant]/page";

export default function RootMapGateway() {
  const rootParamPromise = Promise.resolve({ tenant: "_root" });
  return <TenantMapPortal params={rootParamPromise} />;
}