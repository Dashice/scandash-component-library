'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const index = require('./index-501a54ec.js');

/*
 Stencil Client Patch Esm v2.19.2 | MIT Licensed | https://stenciljs.com
 */
const patchEsm = () => {
    return index.promiseResolve();
};

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patchEsm().then(() => {
  return index.bootstrapLazy([["scandash-dropdown.cjs",[[1,"scandash-dropdown",{"options":[1],"placeholder":[1],"itemSize":[2,"item-size"],"fontSize":[2,"font-size"],"sanitizedOptions":[32],"selectedOption":[32],"isExpanded":[32],"reset":[64]}]]]], options);
  });
};

exports.defineCustomElements = defineCustomElements;
