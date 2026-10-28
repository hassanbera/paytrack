import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus,
  Search,
  Wallet,
  CircleDollarSign,
  Clock3,
  TriangleAlert,
  ArrowUpRight,
  ChevronRight,
  ReceiptText,
  CheckCircle2,
} from 'lucide-react';
import { api, message, money, date } from './lib/api';
import { Shell, Modal, Notice, Stat, Loading, Empty } from './components/ui';
import { type Plan, type Installment, paid, overdue, status, cents } from './types';
export default function App() {
  const [plans, setPlans] = useState<Plan[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('Tümü'),
    [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false),
    [paying, setPaying] = useState<Installment | null>(null),
    [busy, setBusy] = useState(false);
  const [paymentKey, setPaymentKey] = useState('');
  async function refresh() {
    setPlans(await api<Plan[]>('/plans'));
  }
  useEffect(() => {
    refresh()
      .catch((e) => setError(message(e)))
      .finally(() => setLoading(false));
  }, []);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const created = await api<Plan>('/plans', {
        method: 'POST',
        body: JSON.stringify({
          title: f.get('title'),
          clientName: f.get('clientName'),
          clientEmail: f.get('clientEmail'),
          totalCents: cents(f.get('total')),
          installmentCount: Number(f.get('count')),
          firstDueDate: f.get('due'),
        }),
      });
      await refresh();
      setCreating(false);
      setSelected(created.id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function pay(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paying) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api('/installments/' + paying.id + '/payments', {
        method: 'POST',
        body: JSON.stringify({
          amountCents: cents(f.get('amount')),
          note: f.get('note'),
          idempotencyKey: paymentKey,
        }),
      });
      await refresh();
      setPaying(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const total = plans.reduce((n, p) => n + p.totalCents, 0),
    collected = plans.reduce((n, p) => n + paid(p), 0),
    late = plans
      .flatMap((p) => p.installments)
      .filter(overdue)
      .reduce((n, i) => n + i.amountCents - i.paidCents, 0);
  const filtered = plans.filter(
    (p) =>
      (p.title + p.clientName).toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')) &&
      (filter === 'Tümü' || status(p) === filter),
  );
  const detail = plans.find((p) => p.id === selected);
  const ratio = total ? Math.round((collected / total) * 100) : 0;
  return (
    <Shell
      title="Tahsilat özeti"
      active="Ödeme planları"
      subtitle="Planlarını düzenle, nakit akışını görünür kıl."
      actions={
        <button className="primary" onClick={() => setCreating(true)}>
          <Plus size={18} />
          Ödeme planı oluştur
        </button>
      }
    >
      <Notice error={error} clear={() => setError('')} />
      <div className="stats">
        <Stat
          label="Toplam plan tutarı"
          value={money(total)}
          detail={plans.length + ' ödeme planı'}
          icon={<Wallet size={18} />}
        />
        <Stat
          label="Tahsil edilen"
          value={money(collected)}
          detail={'Toplamın %' + ratio + ' kadarı'}
          icon={<CircleDollarSign size={18} />}
        />
        <Stat
          label="Kalan alacak"
          value={money(total - collected)}
          detail="Açık taksit bakiyesi"
          icon={<Clock3 size={18} />}
        />
        <Stat
          label="Gecikmiş tutar"
          value={money(late)}
          detail="Vadesi geçmiş açık bakiye"
          icon={<TriangleAlert size={18} />}
        />
      </div>
      <div className="overview-banner">
        <div>
          <span className="eyebrow">TAHSİLAT PERFORMANSI</span>
          <h2>Her ödeme, daha net bir gelecek.</h2>
          <p>
            Planların toplam tahsilat oranı <strong>%{ratio}</strong>.
          </p>
        </div>
        <div
          className="ring"
          style={{ background: 'conic-gradient(var(--accent) ' + ratio + '%, #dce9e3 0)' }}
        >
          <span>
            {ratio}
            <small>%</small>
          </span>
        </div>
      </div>
      <section className="surface">
        <div className="section-toolbar">
          <h2>
            Ödeme planları <span className="badge">{plans.length}</span>
          </h2>
          <label className="search">
            <Search size={16} />
            <input
              aria-label="Planlarda ara"
              placeholder="Müşteri veya plan ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="tabs">
          {['Tümü', 'Devam ediyor', 'Gecikmiş', 'Tamamlandı'].map((t) => (
            <button key={t} className={filter === t ? 'selected' : ''} onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
        {loading ? (
          <Loading />
        ) : !filtered.length ? (
          <Empty>Bu görünümde ödeme planı yok.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>MÜŞTERİ / PLAN</th>
                  <th>PLAN TUTARI</th>
                  <th>TAHSİLAT</th>
                  <th>DURUM</th>
                  <th aria-label="Ayrıntı" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="client-cell">
                        <span className="client-avatar">
                          {p.clientName.slice(0, 2).toLocaleUpperCase('tr')}
                        </span>
                        <div>
                          <strong>{p.clientName}</strong>
                          <small>{p.title}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{money(p.totalCents)}</strong>
                      <small>{p.installments.length} taksit</small>
                    </td>
                    <td>
                      <strong>{money(paid(p))}</strong>
                      <div className="progress-track">
                        <span style={{ width: (paid(p) / p.totalCents) * 100 + '%' }} />
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          'status-badge ' +
                          (status(p) === 'Tamamlandı'
                            ? 'success'
                            : status(p) === 'Gecikmiş'
                              ? 'warning'
                              : 'neutral')
                        }
                      >
                        {status(p)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={p.title + ' ayrıntıları'}
                        onClick={() => setSelected(p.id)}
                      >
                        <ChevronRight size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="hint">
        <ArrowUpRight size={15} />
        Tahsilat eklemek ve taksit geçmişini görmek için bir planın ayrıntılarını aç.
      </div>
      {creating && (
        <Modal title="Yeni ödeme planı" close={() => setCreating(false)}>
          <Notice error={error} clear={() => setError('')} />
          <form onSubmit={create}>
            <label>
              Plan başlığı
              <input
                name="title"
                required
                maxLength={120}
                placeholder="Örn. Web sitesi geliştirme"
                autoFocus
              />
            </label>
            <div className="form-grid">
              <label>
                Müşteri adı
                <input name="clientName" required maxLength={100} />
              </label>
              <label>
                E-posta (isteğe bağlı)
                <input name="clientEmail" type="email" maxLength={200} />
              </label>
              <label>
                Toplam tutar (₺)
                <input name="total" type="number" min="0.01" max="10000000" step="0.01" required />
              </label>
              <label>
                Taksit sayısı
                <input name="count" type="number" min="1" max="36" defaultValue="3" required />
              </label>
            </div>
            <label>
              İlk vade tarihi
              <input
                name="due"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <p className="form-help">
              Taksitler aylık oluşturulur. Ay sonu tarihleri ilgili ayın son gününe uyarlanır.
            </p>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setCreating(false)}>
                Vazgeç
              </button>
              <button className="primary" disabled={busy}>
                {busy ? 'Oluşturuluyor…' : 'Planı oluştur'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {detail && !paying && (
        <Modal title={detail.title} close={() => setSelected(null)}>
          <div className="detail-intro">
            <div>
              <span className="eyebrow">{detail.clientName}</span>
              <h3>{money(detail.totalCents)}</h3>
              <p>
                {detail.clientEmail || 'Ödeme planı'} · Kalan{' '}
                {money(detail.totalCents - paid(detail))}
              </p>
            </div>
            <ReceiptText size={32} />
          </div>
          <div className="installments">
            {detail.installments.map((i) => (
              <div className="installment" key={i.id}>
                <div className="installment-head">
                  <span
                    className={
                      'installment-number ' + (i.paidCents === i.amountCents ? 'settled' : '')
                    }
                  >
                    {i.paidCents === i.amountCents ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      String(i.number).padStart(2, '0')
                    )}
                  </span>
                  <div>
                    <strong>
                      {i.number}. taksit · {money(i.amountCents)}
                    </strong>
                    <small>
                      {date(i.dueDate)}{' '}
                      {overdue(i) && <span className="text-warning">· Gecikmiş</span>}
                    </small>
                  </div>
                  {i.paidCents < i.amountCents && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setPaying(i);
                        setPaymentKey(crypto.randomUUID());
                      }}
                    >
                      Tahsilat ekle
                    </button>
                  )}
                </div>
                <div className="installment-balance">
                  Ödenen {money(i.paidCents)}{' '}
                  <span>Kalan {money(i.amountCents - i.paidCents)}</span>
                </div>
                {i.payments.map((p) => (
                  <div key={p.id} className="payment-line">
                    <span>
                      {date(p.createdAt)} · {p.note || 'Tahsilat'}
                    </span>
                    <strong>+{money(p.amountCents)}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Modal>
      )}
      {paying && (
        <Modal title="Tahsilat ekle" close={() => setPaying(null)}>
          <Notice error={error} clear={() => setError('')} />
          <form onSubmit={pay}>
            <div className="detail-intro">
              <div>
                <span className="eyebrow">{paying.number}. TAKSİT</span>
                <h3>{money(paying.amountCents - paying.paidCents)}</h3>
                <p>Kalan tahsil edilebilir tutar</p>
              </div>
            </div>
            <label>
              Tahsilat tutarı (₺)
              <input
                name="amount"
                type="number"
                min="0.01"
                max={(paying.amountCents - paying.paidCents) / 100}
                step="0.01"
                defaultValue={((paying.amountCents - paying.paidCents) / 100).toFixed(2)}
                required
                autoFocus
              />
            </label>
            <label>
              Not
              <textarea name="note" maxLength={300} placeholder="Örn. Banka havalesi" />
            </label>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setPaying(null)}>
                Vazgeç
              </button>
              <button className="primary" disabled={busy}>
                {busy ? 'Kaydediliyor…' : 'Tahsilatı kaydet'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Shell>
  );
}
