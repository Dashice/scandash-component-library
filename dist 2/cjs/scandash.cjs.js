'use strict';

const index = require('./index-501a54ec.js');

/*
 Stencil Client Patch Browser v2.19.2 | MIT Licensed | https://stenciljs.com
 */
const patchBrowser = () => {
    const importMeta = (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('scandash.cjs.js', document.baseURI).href));
    const opts = {};
    if (importMeta !== '') {
        opts.resourcesUrl = new URL('.', importMeta).href;
    }
    return index.promiseResolve(opts);
};

patchBrowser().then(options => {
  return index.bootstrapLazy([["scandash-dropdown.cjs",[[1,"scandash-dropdown",{"options":[1],"placeholder":[1],"itemSize":[2,"item-size"],"fontSize":[2,"font-size"],"sanitizedOptions":[32],"selectedOption":[32],"isExpanded":[32],"reset":[64]}]]]], options);
});
