'use client';

import styles from './sky-toggle.module.css';

export function SkyToggle({ dark, onChange }: { dark: boolean; onChange: () => void }) {
  return (
    <label className={styles['theme-switch']}>
      <input type="checkbox" role="switch" aria-label="Dark mode" checked={dark} onChange={onChange} className={styles['theme-switch__checkbox']} />
      <span className={styles['theme-switch__container']} aria-hidden="true" style={{ display: 'block' }}>
        <span className={styles['theme-switch__clouds']} />
        <span className={styles['theme-switch__stars-container']}>
          <svg viewBox="0 0 144 55" fill="currentColor">
            <path d="M20 9l2 5 5 2-5 2-2 5-2-5-5-2 5-2zm35 23l2 4 4 2-4 2-2 4-2-4-4-2 4-2zm30-24l2 5 5 2-5 2-2 5-2-5-5-2 5-2zm35 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          </svg>
        </span>
        <span className={styles['theme-switch__circle-container']}>
          <span className={styles['theme-switch__sun-moon-container']}>
            <span className={styles['theme-switch__moon']} style={{ display: 'block' }}>
              <span className={styles['theme-switch__spot']} />
              <span className={styles['theme-switch__spot']} />
              <span className={styles['theme-switch__spot']} />
            </span>
          </span>
        </span>
      </span>
    </label>
  );
}
