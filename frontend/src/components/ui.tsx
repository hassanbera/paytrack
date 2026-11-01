import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import {
  Button,
  Input,
  Modal as AntModal,
  Alert,
  Card,
  Spin,
  Empty as AntEmpty,
  Statistic,
} from 'antd';
import { Wallet } from 'lucide-react';
export function UiButton({
  className = '',
  type,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>) {
  return (
    <Button
      className={className}
      type={
        className.includes('primary') || className.includes('selected')
          ? 'primary'
          : className.includes('icon-button')
            ? 'text'
            : 'default'
      }
      danger={className.includes('danger')}
      htmlType={type ?? 'submit'}
      {...props}
    />
  );
}
export function UiInput({
  size: _size,
  color: _color,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} />;
}
export function UiTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Input.TextArea rows={3} {...props} />;
}
export function Shell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  active: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="paytrack-workspace">
      <header className="finance-header">
        <a href="/" className="finance-brand">
          <Wallet size={25} />
          PayTrack
        </a>
        <span>Tahsilat yönetimi</span>
        <span className="finance-period">Ödeme planları ve hesap hareketleri</span>
      </header>
      <main className="finance-main">
        <div className="page-heading">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <AntModal open title={title} onCancel={close} footer={null} width={620} destroyOnHidden>
      {children}
    </AntModal>
  );
}
export function Notice({ error, clear }: { error: string; clear: () => void }) {
  return error ? <Alert type="error" message={error} closable onClose={clear} showIcon /> : null;
}
export function Stat({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="stat" size="small">
      <span className="stat-label">
        {icon}
        {label}
      </span>
      <Statistic value={typeof value === 'number' ? value : 0} formatter={() => value} />
      <small className="stat-detail">{detail}</small>
    </Card>
  );
}
export function Loading() {
  return (
    <div className="empty" role="status">
      <Spin />
      Ödemeler yükleniyor…
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <AntEmpty description={children} image={AntEmpty.PRESENTED_IMAGE_SIMPLE} />;
}
