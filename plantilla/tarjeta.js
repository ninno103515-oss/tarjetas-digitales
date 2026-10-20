// Botón "Compartir": usa la función de compartir del celular; si no existe, copia el link.
(function () {
  var boton = document.getElementById('compartir');
  var aviso = document.getElementById('aviso');
  if (!boton) return;

  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.add('visible');
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(function () { aviso.classList.remove('visible'); }, 2800);
  }

  function copiarViejo(texto) {
    var campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    campo.setSelectionRange(0, texto.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(campo);
    return ok;
  }

  function copiar(url) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        mostrarAviso('Link copiado. Pégalo donde quieras.');
      }, function () {
        if (copiarViejo(url)) mostrarAviso('Link copiado. Pégalo donde quieras.');
        else window.prompt('Copia este link:', url);
      });
    } else if (copiarViejo(url)) {
      mostrarAviso('Link copiado. Pégalo donde quieras.');
    } else {
      window.prompt('Copia este link:', url);
    }
  }

  boton.addEventListener('click', function () {
    var url = boton.getAttribute('data-url') || location.href.split('#')[0];
    var datos = { title: document.title, text: boton.getAttribute('data-texto') || document.title, url: url };
    if (navigator.share) {
      navigator.share(datos).catch(function (error) {
        if (error && error.name === 'AbortError') return; // la persona cerró el menú
        copiar(url);
      });
    } else {
      copiar(url);
    }
  });
})();
