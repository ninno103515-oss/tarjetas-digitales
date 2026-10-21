// Botón "Compartir": abre un menú propio de la tarjeta con WhatsApp, Facebook y Copiar link.
(function () {
  var boton = document.getElementById('compartir');
  var aviso = document.getElementById('aviso');
  if (!boton) return;

  var url = boton.getAttribute('data-url') || location.href.split('#')[0];
  var texto = boton.getAttribute('data-texto') || document.title;

  function mostrarAviso(mensaje) {
    aviso.textContent = mensaje;
    aviso.classList.add('visible');
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(function () { aviso.classList.remove('visible'); }, 2800);
  }

  function copiarViejo(valor) {
    var campo = document.createElement('textarea');
    campo.value = valor;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    campo.setSelectionRange(0, valor.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(campo);
    return ok;
  }

  function copiar(valor) {
    var listo = function () { mostrarAviso('Link copiado. Pégalo donde quieras.'); };
    var respaldo = function () { if (copiarViejo(valor)) listo(); else window.prompt('Copia este link:', valor); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(valor).then(listo, respaldo);
    else respaldo();
  }

  // Menú propio (se arma una sola vez)
  var fondo = document.createElement('div');
  fondo.className = 'menu-fondo';
  fondo.innerHTML =
    '<div class="menu-compartir" role="dialog" aria-modal="true" aria-label="Compartir tarjeta">' +
      '<p class="menu-titulo">Compartir tarjeta</p>' +
      '<div class="menu-opciones">' +
        '<a class="menu-opcion" data-opcion="whatsapp" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(texto + '\n' + url) + '">' +
          '<img src="../iconos/whatsapp.png" alt=""><span>WhatsApp</span></a>' +
        '<a class="menu-opcion" data-opcion="facebook" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '">' +
          '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#1877F2"/><path fill="#fff" d="M26.6 38V26.2h4l.6-4.6h-4.6v-2.9c0-1.3.4-2.3 2.3-2.3h2.4v-4.1c-.4-.1-1.9-.2-3.5-.2-3.5 0-5.9 2.1-5.9 6v3.4h-4v4.6h4V38h4.7z"/></svg>' +
          '<span>Facebook</span></a>' +
        '<button class="menu-opcion" type="button" data-opcion="copiar">' +
          '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#3A3A40"/><path fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M21 27l6-6M19.5 23.5l-2.8 2.8a4.2 4.2 0 0 0 6 6l2.8-2.8M28.5 24.5l2.8-2.8a4.2 4.2 0 0 0-6-6l-2.8 2.8"/></svg>' +
          '<span>Copiar link</span></button>' +
      '</div>' +
      '<button class="menu-cerrar" type="button">Cancelar</button>' +
    '</div>';
  document.body.appendChild(fondo);

  function abrir() { fondo.classList.add('abierto'); }
  function cerrar() { fondo.classList.remove('abierto'); }

  boton.addEventListener('click', abrir);
  fondo.addEventListener('click', function (e) {
    if (e.target === fondo || e.target.closest('.menu-cerrar')) return cerrar();
    var opcion = e.target.closest('[data-opcion]');
    if (!opcion) return;
    if (opcion.getAttribute('data-opcion') === 'copiar') copiar(url);
    cerrar();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
})();
