import {LitElement, html, css} from 'lit';
import {classMap} from 'lit/directives/class-map.js';
import {animate} from '@lit-labs/motion';

export class MotionSlide extends LitElement {
  static properties = {
    slid: {type: Boolean},
  };
  static styles = css`
    .circle {
      position: relative;
      background: steelblue;
      --box-size: 25vw;
      height: var(--box-size);
      width: var(--box-size);
      border-radius: 50%;
    }

    .slid {
      left: calc(100% - var(--box-size));
    }
  `;

  constructor() {
    super();
    this.slid = false;
  }

  render() {
    return html`
      <p>
        <button @click=${() => (this.slid = !this.slid)}>Slide</button>
      </p>
      <p class="circle ${classMap({slid: this.slid})}" ${animate()}></p>
    `;
  }
}
customElements.define('motion-slide', MotionSlide);
