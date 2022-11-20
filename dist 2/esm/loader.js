import { p as promiseResolve, b as bootstrapLazy } from './index-e6b3635a.js';

/*
 Stencil Client Patch Esm v2.19.2 | MIT Licensed | https://stenciljs.com
 */
const patchEsm = () => {
    return promiseResolve();
};

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patchEsm().then(() => {
  return bootstrapLazy([["scandash-dropdown",[[1,"scandash-dropdown",{"options":[1],"placeholder":[1],"itemSize":[2,"item-size"],"fontSize":[2,"font-size"],"sanitizedOptions":[32],"selectedOption":[32],"isExpanded":[32],"reset":[64]}]]]], options);
  });
};

export { defineCustomElements };
