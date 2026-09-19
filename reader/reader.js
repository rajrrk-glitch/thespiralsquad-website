/* ── TSS PDF Reader ──────────────────────────────────────────── */
(function () {
  'use strict';

  var config = window.READER_CONFIG;
  if (!config) return;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  var pdfDoc      = null;
  var currentPage = 1;
  var totalPages  = 0;
  var rendering   = false;
  var pendingPage = null;

  var canvas       = document.getElementById('pdfCanvas');
  var ctx          = canvas.getContext('2d');
  var pageNumEl    = document.getElementById('pageNum');
  var pageCountEl  = document.getElementById('pageCount');
  var prevBtn      = document.getElementById('prevBtn');
  var nextBtn      = document.getElementById('nextBtn');
  var stateEl      = document.getElementById('readerState');
  var docWrap      = document.getElementById('docWrap');
  var watermarkEl  = document.getElementById('watermark');
  var progressFill = document.getElementById('progressFill');

  /* ── State display ─────────────────────────────────────────── */
  function setState(state) {
    stateEl.dataset.state = state;
    if (state === 'ready') {
      stateEl.style.display = 'none';
      docWrap.style.display = '';
    } else {
      stateEl.style.display = 'flex';
      docWrap.style.display = 'none';
      var msgs = {
        loading:      'Preparing your document…',
        unauthorized: 'Please verify your access to continue.',
        unavailable:  'This document is currently unavailable.',
        error:        'Something went wrong.'
      };
      stateEl.innerHTML = msgs[state] || '';
      if (state === 'error') {
        var btn = document.createElement('button');
        btn.className = 'rd-retry-btn';
        btn.textContent = 'Try again';
        btn.onclick = function () { location.reload(); };
        stateEl.appendChild(btn);
      }
    }
  }

  /* ── Scale to container ────────────────────────────────────── */
  function getScale(page) {
    var nativeVp = page.getViewport({ scale: 1 });
    var maxW     = Math.min((docWrap.parentElement.clientWidth || 800) - 32, 900);
    return maxW / nativeVp.width;
  }

  /* ── Progress bar ──────────────────────────────────────────── */
  function updateProgress() {
    if (!progressFill || !totalPages) return;
    progressFill.style.width = ((currentPage / totalPages) * 100) + '%';
  }

  /* ── Render ────────────────────────────────────────────────── */
  function renderPage(num) {
    if (rendering) { pendingPage = num; return; }
    rendering = true;
    canvas.classList.remove('in');

    pdfDoc.getPage(num).then(function (page) {
      var scale    = getScale(page);
      var viewport = page.getViewport({ scale: scale });
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      return page.render({ canvasContext: ctx, viewport: viewport }).promise;
    }).then(function () {
      rendering = false;
      canvas.classList.add('in');
      pageNumEl.textContent  = currentPage;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      updateProgress();

      if (config.watermark) applyWatermark(config.watermark);

      if (pendingPage !== null) {
        var next = pendingPage;
        pendingPage = null;
        renderPage(next);
      }
    }).catch(function () {
      rendering = false;
      setState('error');
    });
  }

  /* ── Navigation ────────────────────────────────────────────── */
  function goTo(num) {
    if (!pdfDoc || num < 1 || num > totalPages || num === currentPage) return;
    currentPage = num;
    renderPage(currentPage);
  }

  /* ── Watermark ─────────────────────────────────────────────── */
  function applyWatermark(data) {
    if (!watermarkEl) return;
    var lines = [];
    if (data.email)   lines.push(data.email);
    if (data.orderId) lines.push(data.orderId);
    if (data.label)   lines.push(data.label);
    if (!lines.length) return;
    watermarkEl.textContent = lines.join('\n');
    watermarkEl.style.display = '';
  }

  /* ── Load PDF ──────────────────────────────────────────────── */
  setState('loading');

  pdfjsLib.getDocument({ url: config.pdfPath }).promise
    .then(function (pdf) {
      pdfDoc      = pdf;
      totalPages  = pdf.numPages;
      pageCountEl.textContent = totalPages;
      setState('ready');
      renderPage(1);
    })
    .catch(function () {
      setState('error');
    });

  /* ── Button events ─────────────────────────────────────────── */
  prevBtn.addEventListener('click', function () { goTo(currentPage - 1); });
  nextBtn.addEventListener('click', function () { goTo(currentPage + 1); });

  /* ── Keyboard ──────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft')  goTo(currentPage - 1);
    if (e.key === 'ArrowRight') goTo(currentPage + 1);
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') e.preventDefault();
  });

  /* ── Block context menu on the doc wrapper ─────────────────── */
  docWrap.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ── Resize ────────────────────────────────────────────────── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (pdfDoc) renderPage(currentPage);
    }, 200);
  });

})();
