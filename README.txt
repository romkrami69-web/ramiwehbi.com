Rami Wehbi Photography — ramiwehbi.com

Single-page site (index.html), originally designed on Claude.ai.
All styles and scripts are inline in index.html; three.js and Lenis load from CDN.

Photos:
  img/*.jpg       web-sized photos (gallery, about, featured, hero)
  img/ring/*.webp small versions used as textures for the 3D gallery in the hero

To change a photo, replace the file in img/ (and its small copy in img/ring/)
keeping the same file name.

Arabic page:
  ar/index.html is generated from index.html — don't edit it by hand.
  After changing index.html (including the Arabic texts in the AR dictionary
  inside it), run:  node tools/build-ar.js   (needs Node + Playwright)

Images:
  img/w/<name>-<width>.webp  WebP sizes the page actually loads (each screen
                             picks the smallest one that looks sharp)
  The .jpg files stay for link previews and search engines.
  If you add or replace a photo, regenerate its WebP sizes and update WIDTHS
  in index.html.

3D album:
  album/index.html  page-flip wedding album (photos in the order of the pages)
  album/page-flip.browser.js  StPageFlip 2.0.7 (MIT), self-hosted
  To add a photo to the album, copy one of the photo <div class="page"> blocks
  and change the file names. Keep the total number of pages even.
