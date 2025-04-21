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
    const width = document.clientWidth;
    const height = document.clientHeight;
    return html`
      <p style="width: ${width + 'px'}; height: ${height + 'px'};" .propName=${globalThis.fooBar}>
        <button @click=${() => (this.slid = !this.slid)}>Slide ${'foo'}${'bar'}</button>
      </p>
      <p class="circle ${classMap({slid: this.slid})}" ${animate()}></p>
      <div @camelCase=${e => console.log(e)}></div>
    `;
  }
}
customElements.define('motion-slide', MotionSlide);
