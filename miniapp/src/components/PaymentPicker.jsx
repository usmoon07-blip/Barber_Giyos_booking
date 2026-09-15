import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { haptic } from '../telegram';
import { CheckIcon } from './Icons';

/** To'lov turini tanlash: naqd pul yoki karta. */
export default function PaymentPicker({ value, onChange }) {
  const { text, payment, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const cashEnabled = payment ? payment.cashEnabled : true;
  const cardEnabled = payment ? payment.cardEnabled && Boolean(payment.cardNumber) : false;

  const options = [
    { id: 'CASH', icon: '💵', title: text.booking.cash, hint: text.booking.cashHint, enabled: cashEnabled },
    { id: 'CARD', icon: '💳', title: text.booking.card, hint: text.booking.cardHint, enabled: cardEnabled },
  ].filter((option) => option.enabled);

  const copyCard = async () => {
    const digits = String(payment.cardNumber).replace(/\s/g, '');

    try {
      await navigator.clipboard.writeText(digits);
    } catch (_error) {
      // Eski brauzerlarda clipboard API ishlamasligi mumkin
      const helper = document.createElement('textarea');
      helper.value = digits;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      try {
        document.execCommand('copy');
      } catch (_copyError) {
        showToast(digits);
      }
      document.body.removeChild(helper);
    }

    haptic('success');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (options.length < 2 && !options.some((option) => option.id === 'CARD')) {
    // Faqat naqd — tanlash shart emas
    return null;
  }

  return (
    <>
      <h2 className="step-title" style={{ fontSize: 17 }}>
        {text.booking.paymentTitle}
      </h2>

      <div className="container">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`barber-option${value === option.id ? ' barber-option--active' : ''}`}
            onClick={() => {
              haptic('light');
              onChange(option.id);
            }}
          >
            <div className="pay-icon">{option.icon}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="barber-option__name">{option.title}</p>
              <p className="barber-option__bio">{option.hint}</p>
            </div>

            <span className={`check${value === option.id ? ' check--on' : ''}`}>
              {value === option.id ? <CheckIcon /> : null}
            </span>
          </button>
        ))}

        {value === 'CARD' && payment?.cardNumber ? (
          <div className="card-box">
            <div className="card-box__label">{text.booking.cardNumber}</div>
            <div className="card-box__number">{payment.cardNumber}</div>

            {payment.cardHolder ? (
              <div className="card-box__holder">
                {text.booking.cardHolder}: <b>{payment.cardHolder}</b>
              </div>
            ) : null}
            {payment.cardBank ? <div className="card-box__holder">🏦 {payment.cardBank}</div> : null}

            <button type="button" className="btn btn--secondary btn--sm card-box__copy" onClick={copyCard}>
              {copied ? text.booking.copied : `📋 ${text.booking.copy}`}
            </button>

            <p className="card-box__note">{text.booking.cardNote}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
