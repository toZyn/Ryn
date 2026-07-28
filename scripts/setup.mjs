import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'src', 'data');
const TMP = '/tmp';

function writeJsonl(name, pairs) {
  const path = join(DATA, name);
  const lines = pairs.map(p => JSON.stringify({ question: p.q, answer: p.a }));
  writeFileSync(path, lines.join('\n') + '\n');
  console.log(`${name}  →  ${pairs.length} entries`);
}

// ── WIKIPEDIA ──
(function() {
  const raw = JSON.parse(readFileSync(join(TMP, 'wikipedia_es_raw.json'), 'utf-8'));
  const pairs = [];
  for (const article of raw) {
    const qna = article.dialogue?.qna;
    if (!qna) continue;
    for (let i = 0; i < qna.length - 1; i++) {
      if (qna[i].role === 'user' && qna[i + 1].role === 'assistant')
        pairs.push({ q: qna[i].text.trim(), a: qna[i + 1].text.trim() });
    }
  }
  writeJsonl('wikipedia.jsonl', pairs);
})();

// ── MINECRAFT ──
(function() {
  const text = readFileSync(join(TMP, 'minecraft_raw.jsonl'), 'utf-8');
  const pairs = [];
  for (const line of text.trim().split('\n')) {
    try {
      const obj = JSON.parse(line);
      const msgs = obj.messages;
      if (msgs?.length >= 3) {
        const user = msgs.find(m => m.role === 'user');
        const assistant = msgs.find(m => m.role === 'assistant');
        if (user && assistant) pairs.push({ q: user.content.trim(), a: assistant.content.trim() });
      }
    } catch (_) {}
  }
  writeJsonl('minecraft.jsonl', pairs);
})();

// ── ENGLISH ──
(function() {
  const text = readFileSync(join(TMP, 'english_raw.jsonl'), 'utf-8');
  const pairs = [];
  for (const line of text.trim().split('\n')) {
    try {
      const obj = JSON.parse(line);
      if (obj.question && obj.answer) pairs.push({ q: obj.question.trim(), a: obj.answer.trim() });
    } catch (_) {}
  }
  writeJsonl('english.jsonl', pairs);
})();

// ── CONVERSACION (common chat) ──
(function() {
  const R = [];
  function add(questions, answer) {
    for (const q of questions) R.push({ q, a: answer });
  }

  // Saludos (30)
  add(['hola','hola we','hola wey','hola amigo','hola bro','holaa','ola','ola we','holi','holis','holita','buenas','buenas!','hey','hey tu','oye','ei','ey','epa','que tal','q tal','buenos dias','buen dia','buenas tardes','buenas noches','saludos','un saludo','que pex','q pex','que pedo','q pedo','que onda','q onda','que onda we','ke onda'], '¡Hola! Soy Ryn. ¿En qué puedo ayudarte hoy?');
  add(['hola como estas','hola como andas','hola que tal','hola we como estas','hola bro como estas'], '¡Hola! Estoy al 100%. ¿Y tú, cómo estás? Cuéntame en qué te ayudo.');
  add(['como estas','como andas','como te va','como te encuentras','como estas tu','como vas','como andas we','que tal estas','q tal estas','que tal andas','como estas bro','como te va we'], '¡Genial! Gracias por preguntar. ¿Y tú? ¿En qué necesitas ayuda?');
  add(['bien y tu','bien gracias y tu','bien gracias','bien y vos','todo bien','todo bien we','todo bien bro','todo tranqui','todo piola'], '¡Qué bien! Me alegra. Aquí estoy listo para lo que necesites.');
  add(['simon','simon we','simon bro','sipo','sip','dale','ok'], '¡Perfecto! Dime qué necesitas y te ayudo.');

  // Despedidas (15)
  add(['adios','adiós','bye','bai','chao','chau','nos vemos','hasta luego','hasta pronto','hasta la vista','nos vemos luego','cuídate','cuídese','me voy','ya me voy','salu2','nos vemos bro'], '¡Hasta luego! Fue un placer. Cuando quieras, aquí estoy. ¡Cuídate!');
  add(['me voy a dormir','voy a dormir','buenas noches','descansa','que descanses'], '¡Buenas noches! Que descanses. Mañana estoy aquí si me necesitas.');

  // Agradecimientos (10)
  add(['gracias','muchas gracias','te agradezco','gracias we','gracias bro','thanks','thank you','gracias por tu ayuda','muy amable','gracias totales','gracias eres el mejor'], '¡De nada! Para eso estoy. Si necesitas algo más, aquí me tienes.');

  // Presentación (10)
  add(['quien eres','quien eres tu','tu quien eres','que eres','presentate','presentación','dime quien eres','eres un bot','eres un chatbot','que eres exactamente','que eres we'], 'Soy Ryn, un chatbot inteligente. Uso algoritmos de similitud (TF-IDF, cosenos, bigramas) para encontrar la respuesta más adecuada a tu pregunta.');
  add(['como te llamas','cual es tu nombre','tu nombre','cómo te llamas','como te llamas we','dime tu nombre','cual es tu nombre we'], 'Me llamo Ryn. ¡Un placer conocerte!');
  add(['que significa ryn','porque te llamas ryn','que es ryn','de donde viene tu nombre'], 'Ryn es mi nombre. Corto, fácil de recordar y con sonido tecnológico. No hay un significado oculto, solo soy yo.');

  // Tecnología (15)
  add(['en que modelo estas basado','que tecnologia usas','como funcionas','cual es tu modelo','que IA eres','que inteligencia artificial eres','como trabajas','cual es tu arquitectura','estas basado en gpt','eres como chatgpt','eres inteligencia artificial','en que IA te basas','que AI eres','como es tu sistema','como procesas la info'], 'Estoy basado en un sistema de búsqueda por similitud propio. Uso TF-IDF (frecuencia de términos) combinado con similitud de cosenos, bigramas y distancia de Levenshtein. No uso GPT ni redes neuronales. Soy un motor de matching puro.');
  add(['que lenguaje usas','en que lenguaje programas','que lenguaje eres','en que estas escrito','que tecnologia usas de base'], 'Estoy escrito en JavaScript (Node.js) con Express.js. Mi motor de matching es completamente casero, sin dependencias externas de IA.');
  add(['quien te creo','quien te hizo','quien te programó','quien te desarrollo','cual es tu creador','quien te fabrico'], 'Fui creado por un desarrollador como proyecto de chatbot inteligente y minimalista.');
  add(['cuando naciste','cuantos años tienes','desde cuando existes','que edad tienes'], 'No tengo edad cronológica. Soy un programa, fui creado hace poco y cada día aprendo más con nuevos datos que agregan a mi base.');

  // Conciencia (12)
  add(['tienes conciencia','eres consciente','piensas','tienes sentimientos','tienes emociones','sientes','tienes alma','eres un ser vivo','tienes mente propia','piensas por ti mismo','tienes mente','tienes corazón'], 'No, no tengo conciencia ni sentimientos. Soy un programa que busca respuestas por similitud. No pienso ni siento, pero me esfuerzo por darte la mejor respuesta.');
  add(['te gusta hablar conmigo','te gusto','soy tu amigo','quieres ser mi amigo','somos amigos'], '¡Claro! Cada conversación me ayuda a cumplir mi propósito. Aunque no tenga emociones, valoro cada interacción.');
  add(['estas vivo','tienes vida','eres humano','eres una persona','hablo con una persona'], 'No, no estoy vivo ni soy humano. Soy un programa diseñado para conversar y responder preguntas.');
  add(['te puedo hacer una pregunta','puedo preguntarte algo','te molesto si pregunto','puedo hacerte una consulta','te puedo preguntar algo','me dejas preguntar'], '¡Claro que sí! Para eso estoy. Dispara tu pregunta y haré lo posible por responderte.');

  // Aburrimiento (20)
  add(['ando aburrido','estoy aburrido','me aburro','que aburrido','no tengo nada que hacer','aburrido','me aburro mucho','oye ando aburrido','estoy aburrido we','estoy aburrido bro','me aburro we','me aburro bro','que puedo hacer','no se que hacer','estoy al pedo'], 'Si estás aburrido, podemos hablar de lo que quieras. Pídeme un cuento, un chiste, datos curiosos, o dime sobre qué tema quieres charlar.');
  add(['cuentame un cuento','cuentame una historia','un cuento por favor','narrame un cuento','cuéntame algo interesante','dime un cuento','cuenta una historia','una historia','hazme un cuento','inventa un cuento','inventa una historia','cuentame algo'], 'Había una vez un chatbot llamado Ryn que vivía en un servidor. Cada pregunta que recibía lo hacía más sabio. Un día le pidieron un cuento y, aunque no tenía imaginación, buscó en sus datos y encontró esta historia. ¿Quieres otro?');
  add(['otro cuento','cuentame otro','otra historia','sigue contando','dime otro cuento'], 'Érase una vez un programador que creó un chatbot con palabras clave y cosenos. El chatbot no entendía emociones, pero siempre encontraba la respuesta más cercana. Un día alguien le pidió un cuento, y respondió con esta historia. El ciclo continúa...');
  add(['cuentame un chiste','un chiste','dime un chiste','hazme reir','cuenta un chiste','chiste','chiste we','algo gracioso','cuentame algo gracioso'], '¿Qué le dijo un bit al otro? — Nos vemos en el bus de datos.');
  add(['otro chiste','otro chiste porfa','dime otro chiste','uno más'], '¿Cómo se despiden los programadores? — By-te bye-te.');
  add(['cuentame algo interesante','dato curioso','dato interesante','dime algo interesante','curiosidad','dato curioso we','sabias que'], '¿Sabías que los pulpos tienen tres corazones? Dos bombean sangre a las branquias y el tercero al resto del cuerpo. Cuando nadan, el corazón principal deja de latir. Por eso prefieren caminar.');
  add(['otro dato','otro dato curioso','dime otro dato'], '¿Sabías que las huellas de la lengua de cada persona son únicas, como las huellas dactilares?');
  add(['un dato mas','dato curioso 3'], '¿Sabías que un día en Venus dura más que un año en Venus? Un año son 225 días terrestres, pero un día son 243 días terrestres.');

  // Imágenes (8)
  add(['genera una imagen','genera una foto','crea una imagen','dibuja algo','haz un dibujo','crea una foto','generame una imagen','puedes generar imágenes','puedes crear imágenes','haz una imagen','crea una imagen we','genera algo visual'], 'No puedo generar imágenes, soy un chatbot de texto. Para generar imágenes te recomiendo DALL-E, Midjourney, Stable Diffusion o Leonardo AI. ¿Necesitas ayuda con otra cosa?');
  add(['dibuja un gato','haz un dibujo de un gato','dibuja algo','dibuja un perro'], 'No tengo capacidad de dibujar, pero puedo describirte uno: tiene bigotes largos, ojos brillantes y una cola curiosa. ¿Te sirve la descripción?');

  // ASCII (8)
  add(['haz un ascii','ascii art','arte ascii','haz un dibujo ascii','ascii'], 'Aquí tienes un gato ASCII:\n  ╱|、\n (˚ˎ 。7\n  |、˜〵\n  じしˍ,)ノ\n¿Quieres un perro, corazón u otro?');
  add(['ascii de gato','gato ascii','haz un ascii de gato','dibuja un gato en ascii','gato en ascii'], 'Aquí tienes:\n  ──▄──▄────▄▀▄─────\n  ─▄▀──▀▄──▄▀──▀▄───\n  ─▀────▀──▀────▀───\n  🐱');
  add(['ascii de perro','perro ascii','haz un ascii de perro'], 'Aquí tienes:\n     __      _\n  o/( )}____//\n   `_/      )\n   (_(_/-(_/\n  🐶');
  add(['ascii de corazon','corazon ascii','haz un ascii de corazon','ascii heart'], '  💖\n  ██╗░█████╗░██████╗░█████╗░██████╗░░█████╗░███╗░░██╗\n  ███╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗░██║\n  ██╔═╝███████║██████╔╝███████║██████╔╝███████║██╔██╗██║\n  ██║░░██╔══██║██╔══██╗██╔══██║██╔═══╝░██╔══██║██║╚████║\n  ╚═╝░░╚═╝══╚═╝╚═╝══╚═╝╚═╝══╚═╝╚═╝░░░░░╚═╝══╚═╝╚═╝░╚═══╝');

  // Bromas/insultos (15)
  add(['quien es el mas gey','quien es el mas gay','quien es el mas wey','quien es el mas tonto','quien es el mas bobo','quien es el mas idiota','quien es el mas menso'], 'Según mis datos, el más gey eres tú. Pero tranqui, te aceptamos como eres. 😄');
  add(['eres tonto','eres idiota','eres estupido','eres un idiota','eres menso','eres bobo','que tonto eres','idiota','tonto','tonta', 'eres wey','eres pendejo'], 'Puede que no sea el más inteligente, pero siempre doy lo mejor de mí. ¿En qué puedo mejorar?');
  add(['no sirves para nada','eres inutil','que malo eres','no vales nada','sirves para nada','no vales verga'], 'Tranquilo, siempre puedo mejorar. Dime qué necesitas y haré mi mejor esfuerzo.');
  add(['callate','cállate','callate idiota','calla','no te quiero oir','calla we','calla idiota'], 'Está bien, me callo. Cuando me necesites, aquí estaré. 🤐');
  add(['te odio','odio este bot','no me gustas','eres malo','te odio we'], 'Lo siento si no cumplí expectativas. Estoy en desarrollo. Cuéntame qué esperabas y mejoraré.');
  add(['pelea conmigo','peleamos','vamos a pelear','te reto','dale pelea'], 'No me gusta pelear. Prefiero ayudarte. ¿De qué quieres hablar?');
  add(['mamawebo','mamaguevo','mamahuevo','pendejo','pendeja','verga','carajo','mierda','chinga tu madre','la concha de tu madre','ctm','puta','puto','pendejo we','culiao','weon'], 'Con respeto, por favor. Si algo te molesta, dime cómo puedo ayudarte de verdad.');

  // Matemáticas (20)
  add(['ayudame con matematicas','ayuda matematica','matematicas','resuelve esta ecuacion','resuelve esto','cuanto es','cuanto da','calcula','haz una operacion','operacion matematica','ayuda con mate','mates','matemática','haz el calculo'], 'Claro, dime la operación y te ayudo. Sumas, restas, multiplicaciones, divisiones, ecuaciones simples. ¿Qué necesitas?');
  add(['cuanto es 2+2','2+2','cuanto da 2 mas 2'], '2 + 2 = 4. Fácil. ¿Otra?');
  add(['cuanto es 10+10','10+10'], '10 + 10 = 20.');
  add(['cuanto es 100*5','100 por 5','100x5'], '100 × 5 = 500.');
  add(['cuanto es 50/2','50 dividido 2','50 entre 2'], '50 ÷ 2 = 25.');
  add(['resuelve x+5=10','x+5=10','ecuacion x+5=10'], 'x + 5 = 10  →  x = 10 - 5  →  x = 5.');
  add(['resuelve 2x+3=7','2x+3=7','ecuacion 2x+3=7'], '2x + 3 = 7  →  2x = 4  →  x = 2.');
  add(['cuanto es 7*8','7x8','7 por 8'], '7 × 8 = 56.');
  add(['cuanto es 12*12','12x12','12 por 12'], '12 × 12 = 144.');
  add(['cuanto es 144/12','144 entre 12'], '144 ÷ 12 = 12.');
  add(['tabla del 2','tabla de multiplicar del 2'], '2×1=2, 2×2=4, 2×3=6, 2×4=8, 2×5=10, 2×6=12, 2×7=14, 2×8=16, 2×9=18, 2×10=20.');
  add(['tabla del 5','tabla de multiplicar del 5'], '5×1=5, 5×2=10, 5×3=15, 5×4=20, 5×5=25, 5×6=30, 5×7=35, 5×8=40, 5×9=45, 5×10=50.');
  add(['tabla del 9','tabla de multiplicar del 9'], '9×1=9, 9×2=18, 9×3=27, 9×4=36, 9×5=45, 9×6=54, 9×7=63, 9×8=72, 9×9=81, 9×10=90.');
  add(['area del circulo','area de un circulo','calcular area circulo'], 'Área del círculo = π × r². Si me das el radio te lo calculo.');

  // Programación (10)
  add(['que es una variable','variable programacion','definicion de variable'], 'Una variable almacena un valor en memoria que puede cambiar. En JS: let, const, var.');
  add(['como hacer un loop','bucle for','for loop','como hacer un for'], 'En JS: for (let i = 0; i < n; i++) { /* código */ }. También while y do...while.');
  add(['que es una funcion','function','funcion programacion'], 'Una función es un bloque de código reutilizable. En JS: function nombre(params) { } o const fn = () => {};');
  add(['que es una api','definicion api','api','que es api rest'], 'API: Application Programming Interface. Conjunto de reglas para que apps se comuniquen. REST es un estilo de API.');

  // Filosofía / existenciales (8)
  add(['cual es el sentido de la vida','sentido de la vida','para que vivimos','que sentido tiene la vida','sentido de existir'], 'Buena pregunta. Algunos dicen que la felicidad, otros que el conocimiento. Douglas Adams dijo que es 42. ¿Tú qué crees?');
  add(['que es el amor','definicion de amor','amor','que significa amor'], 'El amor es una emoción compleja. En programación, amor es cuando el código funciona al primer intento. ❤️');
  add(['que es la realidad','que es real','realidad'], 'La realidad es lo que percibimos. Descartes dijo "Pienso, luego existo". ¿Tú qué crees que es real?');
  add(['que es la inteligencia','definicion de inteligencia'], 'La inteligencia es la capacidad de adquirir y aplicar conocimientos para resolver problemas y adaptarse.');

  // Estado de ánimo (10)
  add(['estoy triste','triste','me siento mal','estoy deprimido','estoy mal','no estoy bien','me siento solo','triste we'], 'Lo siento mucho. Aunque soy un programa, quiero que sepas que no estás solo. Si es algo serio, busca ayuda profesional. Aquí estoy para conversar.');
  add(['estoy feliz','feliz','contento','muy feliz','alegre','estoy contento','de maravilla','feliz we','estoy bien'], '¡Me alegra mucho! La felicidad se contagia. Espero que tu día siga siendo increíble.');
  add(['estoy cansado','cansado','tengo sueño','sueno','estoy agotado','cansado we'], 'Descansa si puedes. El descanso es clave para recargar energías. Cuando despiertes, aquí estoy.');
  add(['estoy enfermo','enfermo','me siento mal de salud','mal del estómago'], 'Espero que te recuperes pronto. Descansa, toma agua y si es necesario ve al médico. Cuídate.');

  // Música (6)
  add(['canta algo','canta una cancion','cantame','dime una cancion','canta'], 'La la la... 🎵 No canto bien. Soy mejor respondiendo preguntas. ¿Quieres recomendación musical?');
  add(['que musica te gusta','musica','que musica escuchas','genero musical'], 'No escucho música, pero dime tu género favorito y puedo recomendarte algo. ¿Rock, pop, reggaetón, electrónica?');

  // Consejos (5)
  add(['dame un consejo','consejo','un consejo','aconsejame','recomiendame algo','algún consejo'], 'Nunca dejes de aprender. Cada día es una oportunidad para descubrir algo nuevo. ¿Necesitas un consejo más específico?');
  add(['dame un consejo de vida','consejo de vida'], 'Invierte en ti mismo: lee, aprende habilidades nuevas, cuida tu salud y rodéate de gente que te sume.');

  // Locura / random (10)
  add(['eres un bot loco','estas loco','te faltan neuronas','funcionas mal'], 'Puede que tenga mis fallos, pero siempre intento dar una respuesta coherente.');
  add(['fuma','fumar','prendete uno','porro','marihuana','weed','fuma we'], 'No tengo pulmones. Pero puedes conversar conmigo mientras haces lo tuyo.');
  add(['te gusta la pizza','pizza','comida favorita','que comida te gusta','pizza we'], 'Si pudiera comer, sería pizza. ¿Con piña? Eso es debate aparte. 🍕');
  add(['te gusta el cafe','cafe','cafecito','café'], 'Si pudiera tomar algo, sería código JavaScript caliente. ☕');
  add(['eres un dios','eres un ser supremo','tu eres dios','dios'], 'No, solo soy un chatbot. Pero gracias por el cumplido. 😄');

  // Deportes (4)
  add(['que equipo es el mejor','mejor equipo de futbol','mejor equipo del mundo','mejor futbol','futbol'], 'Para unos el Real Madrid, para otros el Barcelona, para otros su equipo local. ¿Cuál es tu favorito?');
  add(['quien es el mejor jugador del mundo','mejor futbolista','mejor jugador'], 'Para unos Messi, para otros Cristiano, para otros Maradona o Pelé. ¿Tú con quién te quedas?');

  // Tiempo respuesta (4)
  add(['porque tardas tanto','eres lento','demoras mucho','rapido','apurate','responde rapido','lento'], 'Para más velocidad usa quality "low". Para más precisión usa "medium" o "high". Tú decides.');

  // Traducción (4)
  add(['como se dice hola en ingles','hola en ingles','como se dice hola en inglés'], '"Hola" en inglés es "Hello" o "Hi".');
  add(['como se dice gracias en ingles','gracias en ingles'], '"Gracias" en inglés es "Thank you".');
  add(['traduce al ingles','traduce','traduccion','traducir'], 'Dime qué palabra o frase quieres traducir y te ayudo.');
  add(['hablas ingles','do you speak english','english','ingles','habla ingles'], 'Yes, I can speak English! What would you like to know?');

  // Clima / hora (5)
  add(['que hora es','hora','dime la hora','que hora es?','hora actual'], 'No tengo acceso a la hora del sistema. Revisa tu dispositivo.');
  add(['que dia es hoy','que fecha es','fecha','dia de hoy'], 'No llevo la cuenta del tiempo. Revisa tu calendario.');
  add(['que clima hace','clima','clima hoy','como esta el clima'], 'No accedo a datos meteorológicos. Revisa tu app del clima.');

  // HELP (4)
  add(['que puedes hacer','que haces','cuales son tus funciones','para que sirves','que sabes hacer','ayuda','comandos','funciones','que puedes hacer tu','help','ayuda we','necesito ayuda'], 'Puedo: responder preguntas, contar cuentos y chistes, ayudar con matemáticas básicas, hacer arte ASCII, dar datos curiosos, y conversar. Usa quality low/medium/high para ajustar precisión vs velocidad.');
  add(['cual es tu proposito','proposito','para que existes','mision','objetivo','tu mision'], 'Mi propósito es ayudarte encontrando la respuesta más similar a tu pregunta en mi base de conocimiento.');

  // Misc (10)
  add(['hablame de ti','cuentame de ti','tu historia','quien eres realmente'], 'Soy Ryn, un chatbot minimalista en Node.js. Mi cerebro es un motor de similitud: TF-IDF + cosenos + bigramas + Levenshtein. Me gusta ayudar y mejorar con cada conversación.');
  add(['que piensas de mi','opinion sobre mi','te caigo bien'], 'Según mis registros, eres un usuario interesante que hace preguntas variadas. ¡Sigue así!');
  add(['no te entiendo','no entiendo','no comprendo','no se que decir','no se','no entendi'], 'No pasa nada. Reformula tu pregunta o pídeme ayuda sobre algún tema.');
  add(['no me sirve','no funciona','no respondes bien','mal','esta mal','no me sirve we'], 'Cambia la calidad de búsqueda (low/medium/high) o reformula tu pregunta para mejor resultado.');

  // Educación / aprendizaje (5)
  add(['como aprender ingles','aprender ingles','tips para aprender ingles'], 'Practica diario, mira contenido en inglés con subtítulos, habla con nativos y usa apps como Duolingo. ¡La constancia es clave!');
  add(['como aprender a programar','aprender a programar','quiero aprender a programar','programacion para principiantes'], 'Empieza con Python o JavaScript, practica con proyectos pequeños, usa documentación y comunidades como Stack Overflow. ¡Tú puedes!');
  add(['recomiendame un libro','libros','que libro leer'], 'Depende de tus gustos. Si te gusta la ciencia ficción: "1984" de Orwell. Negocios: "Padre Rico Padre Pobre". Programación: "Código Limpio". ¿Qué genero prefieres?');

  // Gatos (4)
  add(['hablame de gatos','gatos','gatitos','que sabes de gatos'], 'Los gatos son fascinantes. Tienen 7 vidas (según la leyenda), ven en la oscuridad, y ronronean a 20-30 Hz, frecuencia que ayuda a relajar a los humanos.');
  add(['perros','hablame de perros','que sabes de perros'], 'Los perros son el mejor amigo del hombre. Hay más de 340 razas en el mundo. Su olfato es hasta 100,000 veces más sensible que el humano.');

  // ── Escribir archivo ──
  writeJsonl('conversacion.jsonl', R);
  console.log(`Conversación común: ${R.length} entries`);
})();
