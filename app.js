// Configuración de Supabase vía REST API
const SUPABASE_URL = "https://sfffmetbxrgdeglysuxp.supabase.co";
const SUPABASE_KEY = "sb_publishable_gH-RirFYloP7hLl17B3fGw_bsLhn0Sp";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`
};

const form = document.getElementById('postulante-form');
const selectSexo = document.getElementById('sexo');
const selectGrado = document.getElementById('grado_academico');
const selectCarrera = document.getElementById('carrera_interes');
const selectModalidad = document.getElementById('modalidad_estudio');
const filtroSexo = document.getElementById('filtro-sexo');
const containerPostulantes = document.getElementById('postulantes-container');
const alertMessage = document.getElementById('alert-message');

const inputDni = document.getElementById('dni');
const inputCelular = document.getElementById('celular');

document.addEventListener('DOMContentLoaded', async () => {
  configurarValidacionesBloqueo();
  await cargarCatalogosSupabase();
  await listarPostulantes();
});

// Bloqueo en tiempo real: impide físicamente presionar letras o símbolos en DNI y celular
function configurarValidacionesBloqueo() {
  [inputDni, inputCelular].forEach(input => {
    input.addEventListener('keydown', (e) => {
      // Permitir teclas de control (retroceso, suprimir, tabulación, flechas)
      if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }
      // Bloquear si no es un número del 0 al 9
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
      }
    });
  });
}

async function cargarCatalogosSupabase() {
  try {
    const [resSexo, resGrado, resCarrera, resMod] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/sexos?select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/grados_academicos?select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/carreras_interes?select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/modalidades_estudio?select=*`, { headers })
    ]);

    const datosSexo = await resSexo.json();
    const datosGrado = await resGrado.json();
    const datosCarrera = await resCarrera.json();
    const datosMod = await resMod.json();

    inyectarOpciones(selectSexo, datosSexo);
    inyectarOpciones(selectGrado, datosGrado);
    inyectarOpciones(selectCarrera, datosCarrera);
    inyectarOpciones(selectModalidad, datosMod);

    datosSexo.forEach(item => {
      filtroSexo.innerHTML += `<option value="${item.id}">${item.nombre}</option>`;
    });

  } catch (error) {
    mostrarAlerta("Error al conectar o descargar catálogos de Supabase.", "error");
  }
}

function inyectarOpciones(selectElement, items) {
  selectElement.innerHTML = '<option value="">Seleccione...</option>';
  items.forEach(item => {
    selectElement.innerHTML += `<option value="${item.id}">${item.nombre}</option>`;
  });
}

// Registro POST hacia Supabase incluyendo nuevos campos
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validaciones de longitud estrictas previas al envío
  if (inputDni.value.length !== 8) {
    mostrarAlerta("El DNI debe tener exactamente 8 dígitos.", "error");
    return;
  }
  if (inputCelular.value.length !== 9) {
    mostrarAlerta("El celular debe tener exactamente 9 dígitos.", "error");
    return;
  }

  const bodyPostulante = {
    nombres: document.getElementById('nombres').value,
    apellidos: document.getElementById('apellidos').value,
    dni: inputDni.value,
    edad: parseInt(document.getElementById('edad').value),
    celular: inputCelular.value,
    correo: document.getElementById('correo').value,
    institucion_educativa: document.getElementById('institucion_educativa').value, // Guardar nuevo campo
    promedio_academico: parseFloat(document.getElementById('promedio_academico').value), // Guardar nuevo campo
    sexo_id: parseInt(selectSexo.value),
    grado_academico_id: parseInt(selectGrado.value),
    carrera_interes_id: parseInt(selectCarrera.value),
    modalidad_estudio_id: parseInt(selectModalidad.value),
    observaciones: document.getElementById('observaciones').value
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/postulantes`, {
      method: 'POST',
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(bodyPostulante)
    });

    if (response.ok) {
      mostrarAlerta("¡Postulación registrada correctamente en Supabase!", "success");
      form.reset();
      await listarPostulantes();
    } else {
      throw new Error();
    }
  } catch (error) {
    mostrarAlerta("Error al insertar registro en la base de datos.", "error");
  }
});

// Listado GET con los nuevos campos incrustados en la tarjeta visual
async function listarPostulantes() {
  containerPostulantes.innerHTML = '<p class="loading-text">Sincronizando lista...</p>';
  
  const urlRelacional = `${SUPABASE_URL}/rest/v1/postulantes?select=*,sexos(nombre),grados_academicos(nombre),carreras_interes(nombre),modalidades_estudio(nombre)&order=created_at.asc`;

  try {
    const response = await fetch(urlRelacional, { headers });
    const lista = await response.json();
    
    renderizarCards(lista);
    window.cachePostulantes = lista;
  } catch (error) {
    containerPostulantes.innerHTML = '<p class="loading-text" style="color:var(--error);">Error al leer registros de Supabase.</p>';
  }
}

function renderizarCards(lista) {
  if (lista.length === 0) {
    containerPostulantes.innerHTML = '<p class="loading-text">Ningún postulante registrado aún.</p>';
    return;
  }

  containerPostulantes.innerHTML = '';
  lista.forEach(postulante => {
    const card = document.createElement('div');
    card.className = 'postulante-card';
    
    // Formatear la fecha created_at para que se vea legible y profesional
    const fechaReg = new Date(postulante.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' });

    card.innerHTML = `
      <div class="card-header-postulante">
        <h3>${postulante.nombres} ${postulante.apellidos}</h3>
        <span class="badge badge-sexo">${postulante.sexos?.nombre || 'N/A'}</span>
      </div>
      <div class="card-details">
        <p><strong>DNI:</strong> ${postulante.dni} | <strong>Edad:</strong> ${postulante.edad} años</p>
        <p><strong>Colegio/Univ:</strong> ${postulante.institucion_educativa}</p>
        <p><strong>Promedio:</strong> ⭐ ${parseFloat(postulante.promedio_academico).toFixed(2)}</p>
        <p><strong>Grado Académico:</strong> ${postulante.grados_academicos?.nombre || 'N/A'}</p>
        <p><strong>Carrera de Interés:</strong> ${postulante.carreras_interes?.nombre || 'N/A'}</p>
        <p><strong>Modalidad:</strong> <span class="badge badge-modalidad">${postulante.modalidades_estudio?.nombre || 'N/A'}</span></p>
        ${postulante.observaciones ? `<p><strong>Obs:</strong> <em>"${postulante.observaciones}"</em></p>` : ''}
        
        <div class="contact-info">
          <strong>Celular:</strong> ${postulante.celular}<br>
          <strong>Email:</strong> ${postulante.correo}<br>
          <small style="display:block; margin-top:0.5rem; color:#94a3b8;">Registrado: ${fechaReg}</small>
        </div>
      </div>
    `;
    containerPostulantes.appendChild(card);
  });
}

filtroSexo.addEventListener('change', (e) => {
  const filtroId = e.target.value;
  if (!window.cachePostulantes) return;

  if (filtroId === "todos") {
    renderizarCards(window.cachePostulantes);
  } else {
    const filtrados = window.cachePostulantes.filter(p => p.sexo_id == filtroId);
    renderizarCards(filtrados);
  }
});

function mostrarAlerta(msg, tipo) {
  alertMessage.textContent = msg;
  alertMessage.className = `alert ${tipo}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => alertMessage.className = 'alert hidden', 5000);
}