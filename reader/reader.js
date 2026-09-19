/* ── TSS Reader — Drive iframe + tiled watermark ─────────────── */
(function () {
  'use strict';

  var config = window.READER_CONFIG;
  if (!config || !config.driveFileId) return;

  var params    = new URLSearchParams(window.location.search);
  var orderId   = params.get('order') || '';

  var iframeEl  = document.getElementById('driveFrame');
  var wmEl      = document.getElementById('tileWatermark');
  var stateEl   = document.getElementById('readerState');
  var wrapEl    = document.getElementById('iframeWrap');

  /* ── Load iframe ───────────────────────────────────────────── */
  iframeEl.src = 'https://drive.google.com/file/d/' + config.driveFileId + '/preview';

  iframeEl.addEventListener('load', function () {
    stateEl.style.display  = 'none';
    wrapEl.style.visibility = 'visible';
  });

  /* ── Tiled watermark ───────────────────────────────────────── */
  function buildTile(text) {
    var label = text + ' ▸ ' + (config.productCode || 'TSS');
    var w = 240, h = 110;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">'
      + '<text x="50%" y="55%"'
      + ' transform="rotate(-28 ' + (w / 2) + ' ' + (h / 2) + ')"'
      + ' text-anchor="middle" dominant-baseline="middle"'
      + ' font-family="monospace" font-size="10.5" letter-spacing="1.5"'
      + ' fill="rgba(0,0,0,0.085)">'
      + label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      + '</text></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  if (orderId && wmEl) {
    wmEl.style.backgroundImage  = buildTile(orderId);
    wmEl.style.backgroundRepeat = 'repeat';
    wmEl.style.backgroundSize   = '240px 110px';
    wmEl.style.display          = 'block';
  }

  /* ── Block print (Ctrl/Cmd+P) ──────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') e.preventDefault();
  });

})();
