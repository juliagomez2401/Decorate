/* Se ejecuta antes de pintar la página. Las animaciones están siempre activadas. */
(function (h) {
  h.className += ' js force-motion';
  // cada página arranca desde arriba (las animaciones de entrada dependen de eso)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
})(document.documentElement);
