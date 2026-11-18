/**
 * homly.world/verificar — verificación pública de documentos firmados en Homly.
 *
 * El PDF nunca sale del navegador: se calcula su SHA-256 con WebCrypto y solo la huella se consulta en
 * GET https://api.homly.world/api/v1/public/documents/verify?sha256=… (sin sesión, con límite por IP).
 * Respuesta: {match:false} o {match:true, kind, kind_label, is_final, contract_number, operation, operation_label,
 * status, status_label, signed_at, frozen_at, signers:[{role,name}], agency_name, notice}.
 */
(function () {
  'use strict';

  var API = 'https://api.homly.world/api/v1/public/documents/verify';
  var MAX_BYTES = 25 * 1024 * 1024;
  var TIMEOUT_MS = 15000;

  var input = document.getElementById('archivo');
  var drop = document.getElementById('drop');
  var estado = document.getElementById('estado');
  var resultado = document.getElementById('resultado');
  var formHuella = document.getElementById('form-huella');
  var campoHuella = document.getElementById('huella');
  var ocupado = false;

  var fecha = new Intl.DateTimeFormat('es-VE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Caracas' });

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function avisar(texto, tipo) {
    estado.textContent = texto;
    if (tipo) estado.setAttribute('data-tipo', tipo);
    else estado.removeAttribute('data-tipo');
  }

  function ocupar(si) {
    ocupado = si;
    drop.classList.toggle('busy', si);
    drop.setAttribute('aria-busy', si ? 'true' : 'false');
    input.disabled = si;
  }

  function tamano(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  function hex(buffer) {
    var bytes = new Uint8Array(buffer);
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
    return out;
  }

  function formatoFecha(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    return isNaN(d.getTime()) ? null : fecha.format(d);
  }

  /** Error con el texto que ve la persona. */
  function falla(texto) {
    var e = new Error(texto);
    e.visible = true;
    return e;
  }

  function leerArchivo(file) {
    if (!file) return Promise.reject(falla('No se recibió ningún archivo.'));
    var nombre = (file.name || '').toLowerCase();
    var esPdf = file.type === 'application/pdf' || /\.pdf$/.test(nombre);
    if (!esPdf) return Promise.reject(falla('Ese archivo no es un PDF. Elige el PDF del contrato o de la constancia.'));
    if (file.size === 0) return Promise.reject(falla('El archivo está vacío.'));
    if (file.size > MAX_BYTES) return Promise.reject(falla('El archivo pesa ' + tamano(file.size) + ' y el límite es 25 MB. Los PDF de Homly pesan mucho menos: puede que no sea el original.'));
    if (!window.crypto || !window.crypto.subtle) return Promise.reject(falla('Tu navegador no permite calcular la huella en esta página. Actualízalo o prueba con otro navegador.'));
    return file.arrayBuffer().then(function (buffer) {
      var cabecera = new Uint8Array(buffer, 0, Math.min(1024, buffer.byteLength));
      var texto = String.fromCharCode.apply(null, cabecera);
      if (texto.indexOf('%PDF-') === -1) throw falla('Ese archivo no es un PDF válido aunque termine en .pdf.');
      return window.crypto.subtle.digest('SHA-256', buffer);
    }).then(hex);
  }

  function consultar(sha256) {
    if (navigator.onLine === false) return Promise.reject(falla('Estás sin conexión. La huella ya está calculada: conéctate y vuelve a intentarlo.'));
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    return fetch(API + '?sha256=' + encodeURIComponent(sha256), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: ctrl ? ctrl.signal : undefined,
    }).catch(function (e) {
      if (e && e.name === 'AbortError') throw falla('Homly tardó demasiado en responder. Intenta de nuevo en un momento.');
      throw falla('No se pudo conectar con Homly. Revisa tu conexión e intenta de nuevo.');
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (res.status === 429) throw falla('Hiciste demasiadas consultas seguidas. Espera un minuto e intenta de nuevo (hay un límite por conexión para evitar abusos).');
      if (res.status === 422) throw falla('La huella no es válida: deben ser 64 caracteres entre 0-9 y a-f.');
      if (!res.ok) throw falla('Homly no pudo responder la consulta (error ' + res.status + '). Intenta de nuevo en unos minutos.');
      return res.json().catch(function () { throw falla('Homly respondió algo inesperado. Intenta de nuevo en unos minutos.'); });
    });
  }

  function tipoDe(r) {
    if (!r || r.match !== true) return 'no-coincide';
    if (r.status === 'anulado') return 'anulado';
    if (r.status === 'no_firmado') return 'no-firmado';
    return r.is_final ? 'autentico' : 'previa';
  }

  var TEXTOS = {
    'autentico': ['Documento auténtico', 'Es el original registrado en Homly'],
    'previa': ['Versión previa a las firmas', 'Es de Homly, pero no es el documento firmado'],
    'anulado': ['Contrato anulado', 'Es de Homly, pero ese contrato se anuló'],
    'no-firmado': ['No se firmó', 'Es de Homly, pero ese contrato no llegó a firmarse'],
    'no-coincide': ['No coincide', 'Homly no tiene registrado este archivo exacto'],
  };

  function fila(dl, titulo, valor) {
    if (valor === null || valor === undefined || valor === '') return;
    dl.appendChild(el('dt', { text: titulo }));
    dl.appendChild(typeof valor === 'string' ? el('dd', { text: valor }) : el('dd', {}, [valor]));
  }

  function mostrar(r, sha256, archivo) {
    var tipo = tipoDe(r);
    var t = TEXTOS[tipo];
    resultado.textContent = '';
    resultado.setAttribute('data-tipo', tipo);

    resultado.appendChild(el('span', { class: 'tag', text: t[0] }));
    resultado.appendChild(el('h2', { id: 'res-titulo', text: t[1] + '.' }));

    if (tipo === 'no-coincide') {
      resultado.appendChild(el('p', { class: 'aviso', text: 'El archivo fue modificado, es una copia convertida o escaneada, o no lo emitió Homly. Pide a la agencia el PDF original descargado de Homly y verifícalo de nuevo. Abajo te explicamos qué puede cambiar la huella.' }));
    } else {
      if (r.notice) resultado.appendChild(el('p', { class: 'aviso', text: r.notice }));
    }

    var dl = el('dl');
    if (tipo !== 'no-coincide') {
      fila(dl, 'Documento', r.kind_label);
      fila(dl, 'Contrato', r.contract_number ? 'N° ' + r.contract_number : null);
      fila(dl, 'Operación', r.operation_label || r.operation);
      fila(dl, 'Estado del contrato', r.status_label || r.status);
      fila(dl, 'Firmado el', formatoFecha(r.signed_at));
      fila(dl, 'Texto fijado el', formatoFecha(r.frozen_at));
      fila(dl, 'Agencia', r.agency_name);
      if (Array.isArray(r.signers) && r.signers.length) {
        var ul = el('ul');
        r.signers.forEach(function (s) {
          ul.appendChild(el('li', {}, [document.createTextNode((s.name || '—') + ' '), el('span', { text: '· ' + (s.role || 'Firmante') })]));
        });
        fila(dl, 'Firmantes', ul);
      }
    }
    if (archivo) fila(dl, 'Archivo revisado', archivo.name + ' (' + tamano(archivo.size) + ')');
    fila(dl, 'Huella SHA-256', el('span', { class: 'huella', text: sha256 }));
    resultado.appendChild(dl);

    var otro = el('button', { type: 'button', class: 'btn ghost', text: 'Verificar otro documento' });
    otro.addEventListener('click', function () {
      resultado.hidden = true;
      avisar('');
      input.value = '';
      input.focus();
    });
    resultado.appendChild(el('div', { class: 'acciones' }, [otro]));

    resultado.hidden = false;
    avisar('Listo: ' + t[0].toLowerCase() + '.');
    resultado.focus();
  }

  function procesar(promesaHuella, archivo) {
    if (ocupado) return;
    ocupar(true);
    resultado.hidden = true;
    var huella = null;
    promesaHuella.then(function (sha256) {
      huella = sha256;
      avisar('Huella calculada. Consultando con Homly…');
      return consultar(sha256);
    }).then(function (r) {
      mostrar(r, huella, archivo);
    }).catch(function (e) {
      avisar(e && e.visible ? e.message : 'Algo falló al revisar el archivo. Intenta de nuevo.', 'error');
      return 'error';
    }).then(function (fin) {
      ocupar(false);
      // Tras un error el foco vuelve a donde se elige el archivo (el mensaje ya lo anunció la región de estado).
      if (fin === 'error') (archivo ? input : campoHuella).focus();
    });
  }

  function desdeArchivo(file) {
    if (!file) return;
    avisar('Calculando la huella de «' + file.name + '» en tu dispositivo…');
    procesar(leerArchivo(file), file);
  }

  input.addEventListener('change', function () {
    desdeArchivo(input.files && input.files[0]);
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      drop.classList.add('over');
    });
  });
  ['dragleave', 'dragend'].forEach(function (ev) {
    drop.addEventListener(ev, function () { drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    drop.classList.remove('over');
    var files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    if (files.length > 1) {
      avisar('Suelta un solo PDF a la vez.', 'error');
      return;
    }
    desdeArchivo(files[0]);
  });
  // Soltar el archivo fuera de la zona no debe abrir el PDF en la pestaña (y perder la página).
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });

  formHuella.addEventListener('submit', function (e) {
    e.preventDefault();
    var valor = (campoHuella.value || '').trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(valor)) {
      avisar('La huella debe tener 64 caracteres entre 0-9 y a-f.', 'error');
      campoHuella.setAttribute('aria-invalid', 'true');
      campoHuella.focus();
      return;
    }
    campoHuella.removeAttribute('aria-invalid');
    avisar('Consultando con Homly…');
    procesar(Promise.resolve(valor), null);
  });
})();
