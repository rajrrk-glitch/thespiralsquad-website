/* ── TSS Reader — Drive iframe + tiled watermark ─────────────── */
(function () {
  'use strict';

  var config = window.READER_CONFIG;
  if (!config || !config.driveFileId) return;

  var params      = new URLSearchParams(window.location.search);
  var orderId     = params.get('order') || '';
  var wmText      = orderId
                    ? orderId + ' ▸ ' + (config.productCode || 'TSS')
                    : config.productCode || 'TSS';

  var iframeEl    = document.getElementById('driveFrame');
  var wmEl        = document.getElementById('tileWatermark');
  var stateEl     = document.getElementById('readerState');
  var wrapEl      = document.getElementById('iframeWrap');

  /* ── Load iframe via /embed (no Drive toolbar / share button) ─ */
  iframeEl.src = 'https://drive.google.com/file/d/' + config.driveFileId + '/embed';

  iframeEl.addEventListener('load', function () {
    stateEl.style.display   = 'none';
    wrapEl.style.visibility = 'visible';
  });

  /* ── Tiled watermark (always on) ──────────────────────────────
     Opacity higher when an order ID is present (traceable),
     lighter when no order (fallback branding only).           */
  function buildTile(text, opacity) {
    var w = 260, h = 120;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">'
      + '<text x="50%" y="52%"'
      + ' transform="rotate(-28 ' + (w / 2) + ' ' + (h / 2) + ')"'
      + ' text-anchor="middle" dominant-baseline="middle"'
      + ' font-family="monospace" font-size="11" letter-spacing="2"'
      + ' fill="rgba(0,0,0,' + opacity + ')">'
      + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      + '</text></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  if (wmEl) {
    var opacity = orderId ? 0.14 : 0.05;
    wmEl.style.backgroundImage  = buildTile(wmText, opacity);
    wmEl.style.backgroundRepeat = 'repeat';
    wmEl.style.backgroundSize   = '260px 120px';
    wmEl.style.display          = 'block';
  }

  /* ── Block print ───────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') e.preventDefault();
  });

})();
