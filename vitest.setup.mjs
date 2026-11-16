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
