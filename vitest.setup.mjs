// jsdom に無い API を補う。部品側に jsdom 向けの分岐を持たせないため

// matchMedia: 既定は md 以上（matches: true）。スマホの試験は返る MediaQueryList の matches を書き換える
const mediaQueries = new Map();
window.matchMedia = (query) => {
  if (!mediaQueries.has(query)) {
    mediaQueries.set(query, {
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  }
  return mediaQueries.get(query);
};

Element.prototype.scrollIntoView = () => {};

// <dialog> の showModal / close: jsdom は open 属性しか持たない。top layer・inert・Esc の閉じ要求は再現しないので、
// 開閉と close イベント（ブラウザと同じく後から非同期で届く）だけを補う
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  if (!this.open) return;
  this.open = false;
  setTimeout(() => this.dispatchEvent(new Event("close")), 0);
};
