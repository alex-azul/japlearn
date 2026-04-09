Quiero que implementes una mini web app muy simple para navegador de escritorio. No la hagas como PWA, no hace falta móvil, no hace falta backend, no hace falta autenticación ni persistencia entre sesiones. La app está pensada solo para practicar el significado de palabras japonesas con un enfoque de fuerza bruta progresiva.

Objetivo:
- practicar únicamente “palabra japonesa -> significado”
- usar siempre preguntas de opción múltiple con 4 respuestas
- trabajar por “runs”
- cada run empieza desde cero y no reutiliza estadísticas de runs anteriores

Fuente de datos:
- usa la misma fuente de datos del proyecto principal
- cada entrada tiene como mínimo: id, kanji, furigana, romaji, meaning
- si no se puede leer SQLite directamente en navegador, usa un JSON exportado con el mismo esquema
- el orden de la base de datos importa

Pantalla inicial:
- mostrar un selector para elegir cuántas palabras incluir en el run
- formato visual: X / TOTAL
- X es configurable por el usuario
- ejemplo: 20 / 100
- al pulsar Start, la pool del run son las primeras X palabras de la base de datos, por orden
- no se mezclan con palabras fuera de esas primeras X

Pantalla de práctica:
- mostrar una palabra japonesa grande en el centro
- usar kanji si existe; si no, usar furigana
- debajo, mostrar 4 opciones de significado
- una es la correcta y las otras 3 son distractores elegidos del pool completo de la base de datos, no solo de la pool actual del run
- las opciones se barajan en cada pregunta

Comportamiento:
- no hay modo texto libre, siempre multiple choice
- no hay control complejo de progreso global
- al acertar, se pasa inmediatamente a la siguiente pregunta
- al fallar, también se pasa inmediatamente a la siguiente pregunta
- cuando se falla, además debe quedar visible a un lado un panel pequeño con:
  - la palabra fallada
  - la respuesta correcta
- ese panel lateral muestra solo el último fallo, reemplazando al anterior cuando vuelvas a fallar
- la idea es que el usuario pueda seguir practicando mientras tiene a la vista el último error para anotarlo o escribirlo a mano

Lógica del run:
- cada run mantiene estadísticas solo en memoria
- al empezar un run, todo se resetea
- no guardar nada entre runs ni en localStorage salvo que sea estrictamente necesario para estado temporal de la página
- cada palabra del run debe tener, dentro del run actual:
  - apariciones
  - aciertos
  - fallos
  - winrate
- el siguiente ítem no debe ser puramente aleatorio
- la aleatoriedad debe estar ponderada hacia:
  1) palabras que todavía no tienen historial en el run
  2) palabras con winrate más bajo
- aun así, debe seguir habiendo aleatoriedad real para que no parezca determinista
- no usar una lógica compleja de SRS: solo weighted random simple por run
- las primeras palabras de la pool deberían tender a asentarse porque al aumentar X en runs futuros seguirán estando incluidas, pero eso no se modela con persistencia: simplemente ocurre por el método de estudio del usuario

Reglas para pesos:
- máxima prioridad: palabras nunca preguntadas en el run
- después: palabras con menor winrate
- después: palabras con más fallos absolutos
- evita repetir exactamente la misma palabra dos veces seguidas salvo que la pool sea demasiado pequeña
- si la pool tiene 4 o menos palabras, permite repeticiones normales

UI:
- layout simple de escritorio
- sin animaciones innecesarias
- rápido y limpio
- foco en legibilidad
- prompt grande
- opciones claramente clicables
- panel lateral pequeño para “último fallo”
- arriba puede mostrarse información mínima del run:
  - tamaño de pool
  - preguntas respondidas
  - accuracy actual
- añade un botón para Restart Run
- añade un botón para volver a la pantalla inicial

Detalles de implementación:
- mantenlo KISS
- código claro y corto
- separa mínimamente:
  - carga de datos
  - selección ponderada del siguiente ítem
  - render/UI
  - estado del run
- no inventes features extra
- no añadas spaced repetition
- no añadas perfiles de usuario
- no añadas temporizadores, rachas, niveles, sonidos ni gamificación salvo que sea trivial

Importante:
- la app debe sentirse como una herramienta de práctica bruta, directa y rápida
- no quiero una app “inteligente”; quiero una app mínima para testear en mi cerebro el aprendizaje progresivo por fuerza bruta
- prioriza simplicidad, claridad y velocidad de uso
