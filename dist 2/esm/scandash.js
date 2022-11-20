import { p as promiseResolve, b as bootstrapLazy } from './index-e6b3635a.js';

/*
 Stencil Client Patch Browser v2.19.2 | MIT Licensed | https://stenciljs.com
 */
const patchBrowser = () => {
    const importMeta = import.meta.url;
    const opts = {};
    if (importMeta !== '') {
        opts.resourcesUrl = new URL('.', importMeta).href;
    }
    return promiseResolve(opts);
};

patchBrowser().then(options => {
  return bootstrapLazy([["scandash-dropdown",[[1,"scandash-dropdown",{"options":[1],"placeholder":[1],"itemSize":[2,"item-size"],"fontSize":[2,"font-size"],"sanitizedOptions":[32],"selectedOption":[32],"isExpanded":[32],"reset":[64]}]]]], options);
});
