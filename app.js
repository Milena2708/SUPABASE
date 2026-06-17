import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'



// 1. Configuración de tus credenciales reales de tu proyecto lsyvtohbhrgzmqtvuqop

const supabaseUrl = 'https://sfffmetbxrgdeglysuxp.supabase.co'

const supabaseAnonKey = 'sb_publishable_gH-RirFYloP7hLl17B3fGw_bsLhn0Sp'

const supabase = createClient(supabaseUrl, supabaseAnonKey)



// Captura de elementos del DOM (HTML)

const selectGrado = document.getElementById('grado_academico')

const selectEnfermedad = document.getElementById('enfermedad_preexistente')

const formulario = document.getElementById('pacienteForm')

const mensajeAlerta = document.getElementById('mensajeAlerta')



// Función utilitaria para mostrar alertas en pantalla

function mostrarAlerta(texto, tipo) {

  mensajeAlerta.innerText = texto

  mensajeAlerta.className = `message ${tipo}`

  mensajeAlerta.style.display = 'block'

}



// 2. CARGA DINÁMICA: Descargar datos de Supabase al abrir la página

async function cargarCatalogos() {

  try {

    // Consultar grados académicos activos

    const { data: grados, error: errGrados } = await supabase

      .from('grados_academicos')

      .select('id, nombre')

      .eq('activo', true)



    // Consultar enfermedades activas

    const { data: enfermedades, error: errEnfermedades } = await supabase

      .from('enfermedades_preexistentes')

      .select('id, nombre')

      .eq('activo', true)



    if (errGrados || errEnfermedades) throw new Error("Error al obtener catálogos")



    // Rellenar Select de Grados Académicos

    selectGrado.innerHTML = '<option value="">Seleccione Grado...</option>'

    grados.forEach(g => {

      selectGrado.innerHTML += `<option value="${g.id}">${g.nombre}</option>`

    })



    // Rellenar Select de Enfermedades

    selectEnfermedad.innerHTML = '<option value="">Seleccione Enfermedad...</option>'

    enfermedades.forEach(e => {

      selectEnfermedad.innerHTML += `<option value="${e.id}">${e.nombre}</option>`

    })



  } catch (error) {

    console.error(error)

    mostrarAlerta("Error al cargar los catálogos desde Supabase.", "error")

  }

}



// Ejecutar carga de catálogos inmediatamente

cargarCatalogos()



// 3. REGISTRO Y VALIDACIONES

formulario.addEventListener('submit', async (e) => {

  e.preventDefault() // Evitar que la página se recargue

  mensajeAlerta.style.display = 'none' // Ocultar alertas previas



  // Obtener los valores ingresados por el usuario

  const nombres = document.getElementById('nombres').value.trim()

  const apellidos = document.getElementById('apellidos').value.trim()

  const dni = document.getElementById('dni').value.trim()

  const fecha_nacimiento = document.getElementById('fecha_nacimiento').value

  const edad = document.getElementById('edad').value

  const sexo = document.getElementById('sexo').value

  const celular = document.getElementById('celular').value.trim()

  const correo = document.getElementById('correo').value.trim()

  const direccion = document.getElementById('direccion').value.trim()

  const distrito = document.getElementById('distrito').value.trim()

  const estado_civil = document.getElementById('estado_civil').value

  const grado_academico_id = selectGrado.value

  const enfermedad_preexistente_id = selectEnfermedad.value

  const cuenta_seguro = document.getElementById('cuenta_seguro').value === 'true'

  const tipo_seguro = document.getElementById('tipo_seguro').value.trim()

  const observaciones = document.getElementById('observaciones').value.trim()



  // --- REQUISITOS DE VALIDACIÓN ---

  

  // No enviar formulario vacío / Campos obligatorios no vacíos

  if (!nombres || !apellidos || !dni || !celular || !correo) {

    mostrarAlerta("Por favor, rellene todos los campos obligatorios (*).", "error")

    return

  }

  // DNI debe tener exactamente 8 dígitos numéricos

  if (dni.length !== 8 || isNaN(dni)) {

    mostrarAlerta("El DNI debe tener exactamente 8 dígitos.", "error")

    return

  }

  // Celular debe tener como mínimo 9 dígitos

  if (celular.length < 9 || isNaN(celular)) {

    mostrarAlerta("El celular debe tener como mínimo 9 dígitos.", "error")

    return

  }

  // Formato de correo electrónico válido

  const expresionCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!expresionCorreo.test(correo)) {

    mostrarAlerta("Por favor, ingrese un correo electrónico válido.", "error")

    return

  }

  // Validar selección de catálogos obligatorios

  if (!grado_academico_id) {

    mostrarAlerta("Debe seleccionar un grado académico.", "error")

    return

  }

  if (!enfermedad_preexistente_id) {

    mostrarAlerta("Debe seleccionar una enfermedad preexistente.", "error")

    return

  }



  // --- ENVIAR DATOS A SUPABASE ---

  const { error } = await supabase

    .from('pacientes')

    .insert([{

      nombres, apellidos, dni, fecha_nacimiento: fecha_nacimiento || null,

      edad: edad ? parseInt(edad) : null, sexo: sexo || null, celular, correo,

      direccion: direccion || null, distrito: distrito || null, estado_civil: estado_civil || null,

      grado_academico_id: parseInt(grado_academico_id),

      enfermedad_preexistente_id: parseInt(enfermedad_preexistente_id),

      cuenta_seguro, tipo_seguro: tipo_seguro || null, observaciones: observaciones || null

    }])



  // --- RESPUESTA DE CONFIRMACIÓN O ERROR ---

  if (error) {

    console.error(error)

    // Manejar el caso de DNI repetido (Código de error PostgreSQL '23505' es para violación de llave única)

    if (error.code === '23505') {

      mostrarAlerta("Usuario ya registrado", "error")

    } else {

      mostrarAlerta("No se pudo registrar el paciente. Verifique los datos ingresados.", "error")

    }

  } else {

    mostrarAlerta("Paciente registrado correctamente", "success")

    formulario.reset() // Limpiar el formulario tras el éxito

  }

})