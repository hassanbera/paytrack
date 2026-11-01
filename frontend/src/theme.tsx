import { ConfigProvider, App as AntApp } from 'antd';
import trTR from 'antd/locale/tr_TR';
import type { ReactNode } from 'react';
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        token: {
          colorPrimary: '#157d60',
          colorInfo: '#157d60',
          colorSuccess: '#157d60',
          colorBgLayout: '#f4f5ee',
          colorText: '#183a32',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: 6,
          controlHeight: 40,
        },
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
