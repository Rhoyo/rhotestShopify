import { Component } from '@theme/component';

/**
 * @typedef {object} CountdownRefs
 * @property {HTMLElement} timer - The `role="timer"` wrapper carrying the accessible label.
 * @property {HTMLElement} days
 * @property {HTMLElement} hours
 * @property {HTMLElement} minutes
 * @property {HTMLElement} seconds
 * @property {HTMLElement} [expired] - Optional message shown when the countdown ends.
 */

/**
 * Ticks a server-rendered countdown toward `data-end` (Unix seconds).
 *
 * @extends {Component<CountdownRefs>}
 */
class CountdownTimer extends Component {
  requiredRefs = ['timer', 'days', 'hours', 'minutes', 'seconds'];

  /** @type {number | undefined} */
  #timeoutId;

  /** @type {string} */
  #lastLabelMinute = '';

  connectedCallback() {
    super.connectedCallback();
    this.#start();
  }

  updatedCallback() {
    super.updatedCallback();
    this.#start();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#stop();
  }

  get #endTime() {
    return Number(this.dataset.end) * 1000;
  }

  #start() {
    this.#stop();
    this.#lastLabelMinute = '';
    this.#tick();
  }

  #stop() {
    if (this.#timeoutId !== undefined) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = undefined;
    }
  }

  #tick = () => {
    const end = this.#endTime;
    if (!Number.isFinite(end) || end <= 0) return;

    const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
    this.#render(remaining);

    if (remaining === 0) {
      this.setAttribute('data-expired', '');
      return;
    }

    this.removeAttribute('data-expired');
    // Align the next tick to the start of the next wall-clock second.
    this.#timeoutId = window.setTimeout(this.#tick, 1000 - (Date.now() % 1000) + 10);
  };

  /**
   * @param {number} remaining - Seconds left.
   */
  #render(remaining) {
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    const { timer, days: d, hours: h, minutes: m, seconds: s } = this.refs;

    d.textContent = pad(days);
    h.textContent = pad(hours);
    m.textContent = pad(minutes);
    s.textContent = pad(seconds);

    // Update the accessible label at most once per minute to avoid noisy announcements.
    const minuteKey = `${days}:${hours}:${minutes}`;
    const template = timer.dataset.labelTemplate;
    if (template && minuteKey !== this.#lastLabelMinute) {
      this.#lastLabelMinute = minuteKey;
      timer.setAttribute(
        'aria-label',
        template
          .replace('[days]', String(days))
          .replace('[hours]', String(hours))
          .replace('[minutes]', String(minutes))
      );
    }
  }
}

/**
 * @param {number} value
 * @returns {string}
 */
function pad(value) {
  return String(value).padStart(2, '0');
}

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', CountdownTimer);
}
