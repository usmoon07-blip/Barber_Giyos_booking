import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { haptic } from '../telegram';

const ICONS = ['💈', '🗓', '⏱'];

/** Faqat birinchi kirganda ko'rinadigan 3 ta slayd. */
export default function Onboarding() {
  const { text, language, setLanguage, completeOnboarding } = useApp();
  const [index, setIndex] = useState(0);

  const slides = text.onboarding.slides;
  const isLast = index === slides.length - 1;

  const next = () => {
    haptic('light');
    if (isLast) completeOnboarding();
    else setIndex((current) => current + 1);
  };

  return (
    <div className="onboarding">
      <div className="onboarding__top">
        <div className="onboarding__lang">
          {['uz', 'ru'].map((code) => (
            <button
              key={code}
              type="button"
              className={`lang-btn${language === code ? ' lang-btn--active' : ''}`}
              onClick={() => {
                haptic('light');
                setLanguage(code);
              }}
            >
              {code === 'uz' ? "O'zbekcha" : 'Русский'}
            </button>
          ))}
        </div>

        {!isLast ? (
          <button type="button" className="btn--ghost" style={{ fontSize: 14 }} onClick={completeOnboarding}>
            {text.onboarding.skip}
          </button>
        ) : (
          <span style={{ width: 1 }} />
        )}
      </div>

      <div className="onboarding__body">
        <div className="onboarding__icon">{ICONS[index]}</div>
        <h1 className="onboarding__title">{slides[index].title}</h1>
        <p className="onboarding__text">{slides[index].text}</p>
      </div>

      <div className="onboarding__dots">
        {slides.map((slide, slideIndex) => (
          <span key={slide.title} className={`dot${slideIndex === index ? ' dot--active' : ''}`} />
        ))}
      </div>

      <button type="button" className="btn btn--primary" onClick={next}>
        {isLast ? text.onboarding.start : text.onboarding.next}
      </button>
    </div>
  );
}
