#!/usr/bin/env python3

import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "jlpt_n5_vocab.db"


def radical(number, symbol, variants, strokes, name_es, visual_es):
    return {
        "id": number,
        "radical": symbol,
        "variants": variants,
        "strokes": strokes,
        "name_es": name_es,
        "mnemonic_es": (
            symbol
            + ": "
            + visual_es
            + "; asocialo con "
            + name_es
            + "."
        ),
    }


RADICALS = [
    radical(1, "一", "", 1, "uno", "un unico trazo horizontal"),
    radical(2, "丨", "", 1, "linea vertical", "una linea recta de arriba abajo"),
    radical(3, "丶", "", 1, "punto", "una gota o punto corto"),
    radical(4, "丿", "", 1, "trazo diagonal", "un trazo que cae hacia la izquierda"),
    radical(5, "乙", "乚, 乛", 1, "segundo", "un trazo doblado como una marca secundaria"),
    radical(6, "亅", "", 1, "gancho", "una linea que termina en gancho"),
    radical(7, "二", "", 2, "dos", "dos trazos horizontales"),
    radical(8, "亠", "", 2, "tapa", "un techo simple con punto arriba"),
    radical(9, "人", "亻", 2, "persona", "dos piernas abiertas; al lado se estrecha como 亻"),
    radical(10, "儿", "", 2, "piernas", "dos patas separadas bajo un cuerpo invisible"),
    radical(11, "入", "", 2, "entrar", "un trazo se mete bajo otro hacia dentro"),
    radical(12, "八", "丷", 2, "ocho", "dos trazos que se separan como algo dividido"),
    radical(13, "冂", "", 2, "caja abierta abajo", "un marco abierto por abajo"),
    radical(14, "冖", "", 2, "cubierta", "una tapa baja que cubre algo"),
    radical(15, "冫", "", 2, "hielo", "dos gotas frias a la izquierda"),
    radical(16, "几", "", 2, "mesa", "dos patas sosteniendo una superficie"),
    radical(17, "凵", "", 2, "caja abierta arriba", "un recipiente abierto por arriba"),
    radical(18, "刀", "刂", 2, "cuchillo", "una hoja curva; al lado se ve como刂"),
    radical(19, "力", "", 2, "fuerza", "un brazo doblado haciendo presion"),
    radical(20, "勹", "", 2, "envolver", "un trazo curvo que rodea desde arriba"),
    radical(21, "匕", "", 2, "cuchara", "una forma corta como cuchara o persona girada"),
    radical(22, "匚", "", 2, "caja", "un marco abierto por la derecha"),
    radical(23, "匸", "", 2, "esconder", "una caja abierta donde algo queda oculto"),
    radical(24, "十", "", 2, "diez", "una cruz simple que marca un conteo completo"),
    radical(25, "卜", "", 2, "adivinacion", "un palo con grieta lateral de oraculo"),
    radical(26, "卩", "㔾", 2, "sello", "una persona arrodillada o sello doblado"),
    radical(27, "厂", "", 2, "acantilado", "un techo inclinado como pared de roca"),
    radical(28, "厶", "", 2, "privado", "un pequeño triangulo cerrado sobre si mismo"),
    radical(29, "又", "", 2, "mano derecha", "una mano simple con dos dedos abiertos"),
    radical(30, "口", "", 3, "boca", "un cuadrado abierto como una boca"),
    radical(31, "囗", "", 3, "recinto", "un marco que encierra todo alrededor"),
    radical(32, "土", "", 3, "tierra", "una planta que sale del suelo"),
    radical(33, "士", "", 3, "erudito", "un hombre de pie con la cabeza grande arriba"),
    radical(34, "夂", "", 3, "ir", "un pie que baja al final del camino"),
    radical(35, "夊", "", 3, "ir despacio", "un pie arrastrado con trazo largo"),
    radical(36, "夕", "", 3, "tarde", "una luna incompleta al anochecer"),
    radical(37, "大", "", 3, "grande", "una persona con los brazos muy abiertos"),
    radical(38, "女", "", 3, "mujer", "una figura arrodillada con los brazos cruzados"),
    radical(39, "子", "", 3, "nino", "un nino con cabeza y brazos extendidos"),
    radical(40, "宀", "", 3, "techo", "un tejado que cubre la parte superior"),
    radical(41, "寸", "", 3, "pulgada", "una mano con una marca de medida"),
    radical(42, "小", "⺌", 3, "pequeno", "un trazo central con dos puntitos menores"),
    radical(43, "尢", "尣", 3, "cojo", "una figura inclinada con pierna torcida"),
    radical(44, "尸", "", 3, "cuerpo", "un cuerpo doblado o acostado"),
    radical(45, "屮", "", 3, "brote", "un tallo que asoma del suelo"),
    radical(46, "山", "", 3, "montana", "tres picos de montana"),
    radical(47, "巛", "川", 3, "rio", "corrientes paralelas de agua"),
    radical(48, "工", "", 3, "trabajo", "una herramienta entre dos superficies"),
    radical(49, "己", "已, 巳", 3, "uno mismo", "un trazo enrollado sobre si mismo"),
    radical(50, "巾", "", 3, "tela", "un paño colgado de una barra"),
    radical(51, "干", "", 3, "seco", "un palo atravesado como algo puesto a secar"),
    radical(52, "幺", "", 3, "hilo corto", "un hilo pequeno retorcido"),
    radical(53, "广", "", 3, "cobertizo", "un techo con pared lateral"),
    radical(54, "廴", "", 3, "zancada larga", "un camino que se estira"),
    radical(55, "廾", "", 3, "manos juntas", "dos manos levantando algo"),
    radical(56, "弋", "", 3, "dardo", "un dardo con cuerda o marca lateral"),
    radical(57, "弓", "", 3, "arco", "un arco tensado en vertical"),
    radical(58, "彐", "彑", 3, "hocico", "una boca o hocico horizontal"),
    radical(59, "彡", "", 3, "pelo", "tres mechones o trazos decorativos"),
    radical(60, "彳", "", 3, "paso", "media calle con pequenos pasos"),
    radical(61, "心", "忄, ⺗", 4, "corazon", "un corazon con gotas; al lado se comprime como忄"),
    radical(62, "戈", "", 4, "lanza", "un arma con mango y hoja lateral"),
    radical(63, "戶", "戸", 4, "puerta", "una hoja de puerta vista de lado"),
    radical(64, "手", "扌", 4, "mano", "dedos extendidos; al lado se estrecha como扌"),
    radical(65, "支", "", 4, "rama", "una rama sostenida por una mano"),
    radical(66, "攴", "攵", 4, "golpear", "una mano que toca o golpea con palo"),
    radical(67, "文", "", 4, "escritura", "un dibujo cruzado como marca escrita"),
    radical(68, "斗", "", 4, "cazo", "un cazo con mango"),
    radical(69, "斤", "", 4, "hacha", "una hoja de hacha con mango"),
    radical(70, "方", "", 4, "direccion", "una bandera o figura que apunta"),
    radical(71, "无", "旡", 4, "no haber", "una figura que se tuerce y se queda sin apoyo"),
    radical(72, "日", "", 4, "sol", "un sol cuadrado con una linea interior"),
    radical(73, "曰", "", 4, "decir", "una boca ancha de la que salen palabras"),
    radical(74, "月", "", 4, "luna", "una luna vertical con dos marcas internas"),
    radical(75, "木", "", 4, "arbol", "tronco, ramas y raices en una sola forma"),
    radical(76, "欠", "", 4, "faltar", "una persona abriendo la boca al bostezar"),
    radical(77, "止", "", 4, "detener", "un pie parado sobre el suelo"),
    radical(78, "歹", "歺", 4, "muerte", "huesos o restos torcidos"),
    radical(79, "殳", "", 4, "arma", "una mano con arma o palo"),
    radical(80, "毋", "母", 4, "madre", "una forma cerrada con puntos interiores"),
    radical(81, "比", "", 4, "comparar", "dos figuras una junto a otra"),
    radical(82, "毛", "", 4, "pelaje", "un mechon con trazos finos"),
    radical(83, "氏", "", 4, "clan", "una marca familiar inclinada"),
    radical(84, "气", "", 4, "vapor", "lineas de aire que se elevan"),
    radical(85, "水", "氵, 氺", 4, "agua", "corriente central con gotas; al lado es氵"),
    radical(86, "火", "灬", 4, "fuego", "llamas abiertas; abajo se comprime como灬"),
    radical(87, "爪", "爫", 4, "garra", "dedos curvos agarrando desde arriba"),
    radical(88, "父", "", 4, "padre", "brazos cruzados en una figura adulta"),
    radical(89, "爻", "", 4, "mezclar", "dos cruces superpuestas"),
    radical(90, "爿", "", 4, "madera partida", "media pieza de madera vertical"),
    radical(91, "片", "", 4, "tabla", "la otra mitad de una tabla partida"),
    radical(92, "牙", "", 4, "colmillo", "una punta curva como diente afilado"),
    radical(93, "牛", "牜", 4, "vaca", "cabeza de vaca con cuernos"),
    radical(94, "犬", "犭", 4, "perro", "animal de cuatro patas; al lado se ve como犭"),
    radical(95, "玄", "", 5, "misterioso", "un hilo oscuro colgado bajo una tapa"),
    radical(96, "玉", "王", 5, "jade", "piedras preciosas ensartadas"),
    radical(97, "瓜", "", 5, "melon", "un fruto colgante con semillas"),
    radical(98, "瓦", "", 5, "teja", "una teja curvada"),
    radical(99, "甘", "", 5, "dulce", "una boca con algo sabroso dentro"),
    radical(100, "生", "", 5, "nacer", "un brote que sale del suelo"),
    radical(101, "用", "", 5, "usar", "un marco con herramienta dentro"),
    radical(102, "田", "", 5, "campo", "un campo dividido en parcelas"),
    radical(103, "疋", "", 5, "rollo de tela", "una pieza larga desplegada"),
    radical(104, "疒", "", 5, "enfermedad", "una cama inclinada de enfermo"),
    radical(105, "癶", "", 5, "pasos divergentes", "dos pies abriendose en direcciones opuestas"),
    radical(106, "白", "", 5, "blanco", "un sol con una marca brillante"),
    radical(107, "皮", "", 5, "piel", "una piel sostenida con la mano"),
    radical(108, "皿", "", 5, "plato", "un plato o recipiente visto de frente"),
    radical(109, "目", "", 5, "ojo", "un ojo rectangular con pupila interior"),
    radical(110, "矛", "", 5, "lanza larga", "una lanza con punta y mango"),
    radical(111, "矢", "", 5, "flecha", "una flecha con punta abierta"),
    radical(112, "石", "", 5, "piedra", "una roca bajo un acantilado"),
    radical(113, "示", "礻", 5, "altar", "un altar con ofrendas; al lado se ve como礻"),
    radical(114, "禸", "", 5, "huella", "una huella encerrada"),
    radical(115, "禾", "", 5, "cereal", "una planta de grano inclinada"),
    radical(116, "穴", "", 5, "cueva", "un techo con abertura debajo"),
    radical(117, "立", "", 5, "estar de pie", "una figura plantada sobre el suelo"),
    radical(118, "竹", "⺮", 6, "bambu", "dos tallos de bambu con hojas"),
    radical(119, "米", "", 6, "arroz", "granos alrededor de una espiga"),
    radical(120, "糸", "糹", 6, "seda", "hilos finos retorcidos"),
    radical(121, "缶", "", 6, "vasija", "un recipiente con tapa"),
    radical(122, "网", "罒, 罓", 6, "red", "una malla extendida"),
    radical(123, "羊", "", 6, "oveja", "cuernos y cuerpo de oveja"),
    radical(124, "羽", "", 6, "plumas", "dos alas con plumas"),
    radical(125, "老", "耂", 6, "viejo", "persona mayor con baston o pelo largo"),
    radical(126, "而", "", 6, "y", "barba o lineas que cuelgan"),
    radical(127, "耒", "", 6, "arado", "herramienta agricola con mango"),
    radical(128, "耳", "", 6, "oreja", "una oreja rectangular con pliegues"),
    radical(129, "聿", "⺻", 6, "pincel", "mano sosteniendo un pincel"),
    radical(130, "肉", "月", 6, "carne", "un trozo de carne con vetas internas"),
    radical(131, "臣", "", 6, "ministro", "un ojo inclinado de quien observa al senor"),
    radical(132, "自", "", 6, "uno mismo", "una nariz apuntando a uno mismo"),
    radical(133, "至", "", 6, "llegar", "una flecha que llega al suelo"),
    radical(134, "臼", "", 6, "mortero", "un mortero abierto con hueco central"),
    radical(135, "舌", "", 6, "lengua", "una lengua saliendo de la boca"),
    radical(136, "舛", "", 6, "opuestos", "dos pies cruzados en direcciones contrarias"),
    radical(137, "舟", "", 6, "barco", "una barca estrecha vista de lado"),
    radical(138, "艮", "", 6, "detenerse", "una figura que se frena y gira"),
    radical(139, "色", "", 6, "color", "una marca visible que distingue"),
    radical(140, "艸", "艹", 6, "hierba", "dos brotes de hierba arriba"),
    radical(141, "虍", "", 6, "tigre", "la cabeza rayada de un tigre"),
    radical(142, "虫", "", 6, "insecto", "un bicho con cuerpo y aguijon"),
    radical(143, "血", "", 6, "sangre", "un plato con sangre dentro"),
    radical(144, "行", "", 6, "caminar", "calles en dos columnas para avanzar"),
    radical(145, "衣", "衤", 6, "ropa", "prenda con cuello; al lado se ve como衤"),
    radical(146, "西", "襾", 6, "oeste", "el sol metiendose en una caja al oeste"),
    radical(147, "見", "", 7, "ver", "ojo arriba y piernas abajo"),
    radical(148, "角", "", 7, "cuerno", "un cuerno con base y punta"),
    radical(149, "言", "訁", 7, "hablar", "lineas de palabras sobre una boca"),
    radical(150, "谷", "", 7, "valle", "agua o aire bajando entre montanas"),
    radical(151, "豆", "", 7, "frijol", "un recipiente con legumbres"),
    radical(152, "豕", "", 7, "cerdo", "un cerdo de cuerpo alargado"),
    radical(153, "豸", "", 7, "animal largo", "un animal alargado sin patas claras"),
    radical(154, "貝", "", 7, "concha", "una concha usada como dinero"),
    radical(155, "赤", "", 7, "rojo", "fuego bajo una figura grande"),
    radical(156, "走", "", 7, "correr", "un pie saliendo rapido del suelo"),
    radical(157, "足", "", 7, "pie", "boca o cuerpo arriba y huella abajo"),
    radical(158, "身", "", 7, "cuerpo", "un torso largo con vientre marcado"),
    radical(159, "車", "", 7, "vehiculo", "rueda y eje vistos de frente"),
    radical(160, "辛", "", 7, "picante", "una aguja o hoja puntiaguda"),
    radical(161, "辰", "", 7, "manana", "una concha o arado asociado al amanecer"),
    radical(162, "辵", "辶", 7, "camino", "un pie que avanza por un camino"),
    radical(163, "邑", "阝", 7, "ciudad", "un recinto con gente; a la derecha se ve como阝"),
    radical(164, "酉", "", 7, "vino", "una jarra de vino cerrada"),
    radical(165, "釆", "", 7, "distinguir", "granos separados uno a uno"),
    radical(166, "里", "", 7, "aldea", "campo arriba y tierra abajo"),
    radical(167, "金", "釒", 8, "metal", "pepitas bajo una tapa"),
    radical(168, "長", "镸", 8, "largo", "cabello o cuerpo alargado"),
    radical(169, "門", "", 8, "puerta", "dos hojas de puerta enfrentadas"),
    radical(170, "阜", "阝", 8, "monticulo", "escalones de tierra; a la izquierda se ve como阝"),
    radical(171, "隶", "", 8, "esclavo", "mano sujetando algo con trazos hacia abajo"),
    radical(172, "隹", "", 8, "ave corta", "un ave de cola corta posada"),
    radical(173, "雨", "", 8, "lluvia", "nube con gotas bajo el marco"),
    radical(174, "青", "", 8, "azul verdoso", "crecimiento arriba y luna/color abajo"),
    radical(175, "非", "", 8, "no correcto", "dos alas o filas que se oponen"),
    radical(176, "面", "", 9, "cara", "una cara encerrada con rasgos internos"),
    radical(177, "革", "", 9, "cuero curtido", "piel estirada y trabajada"),
    radical(178, "韋", "", 9, "cuero", "pies rodeando una piel o guardia"),
    radical(179, "韭", "", 9, "puerro", "hojas finas que crecen alineadas"),
    radical(180, "音", "", 9, "sonido", "voz que sale de una boca marcada"),
    radical(181, "頁", "", 9, "pagina cabeza", "una cabeza sobre piernas o base"),
    radical(182, "風", "", 9, "viento", "aire encerrando un insecto que se mueve"),
    radical(183, "飛", "", 9, "volar", "alas repetidas en movimiento"),
    radical(184, "食", "飠", 9, "comida", "tapa y recipiente de alimento"),
    radical(185, "首", "", 9, "cabeza", "cuernos o pelo sobre un ojo/cabeza"),
    radical(186, "香", "", 9, "fragancia", "cereal sobre sol/olor que sube"),
    radical(187, "馬", "", 10, "caballo", "crin, cuerpo y patas del caballo"),
    radical(188, "骨", "", 10, "hueso", "marco oseo sobre carne"),
    radical(189, "高", "", 10, "alto", "torre elevada con boca central"),
    radical(190, "髟", "", 10, "pelo largo", "cabello largo cayendo en mechones"),
    radical(191, "鬥", "", 10, "pelea", "dos partes enfrentadas"),
    radical(192, "鬯", "", 10, "vino ritual", "vasija ritual con marcas dentro"),
    radical(193, "鬲", "", 10, "caldero", "caldero con patas y tapa"),
    radical(194, "鬼", "", 10, "fantasma", "cabeza grande y cola extraña"),
    radical(195, "魚", "", 11, "pez", "cabeza, cuerpo y cola sobre agua"),
    radical(196, "鳥", "", 11, "pajaro", "ave con cabeza, cuerpo y patas"),
    radical(197, "鹵", "", 11, "sal", "recipiente con cristales de sal"),
    radical(198, "鹿", "", 11, "ciervo", "cuernos y patas de ciervo"),
    radical(199, "麥", "麦", 11, "trigo", "espigas y raices de trigo"),
    radical(200, "麻", "", 11, "canamo", "fibras bajo un cobertizo"),
    radical(201, "黃", "黄", 12, "amarillo", "forma ancha como mineral amarillo"),
    radical(202, "黍", "", 12, "mijo", "granos y agua de cereal"),
    radical(203, "黑", "黒", 12, "negro", "humo o fuego que ennegrece"),
    radical(204, "黹", "", 12, "bordado", "puntadas decorativas colgantes"),
    radical(205, "黽", "", 13, "rana", "cuerpo ancho de rana o tortuga"),
    radical(206, "鼎", "", 13, "tripode", "vasija de tres patas"),
    radical(207, "鼓", "", 13, "tambor", "tambor con mano que golpea"),
    radical(208, "鼠", "", 13, "rata", "cuerpo pequeno con patas y cola"),
    radical(209, "鼻", "", 14, "nariz", "nariz sobre campo y base"),
    radical(210, "齊", "斉, 齐", 14, "igualar", "lineas ordenadas a la misma altura"),
    radical(211, "齒", "歯, 齿", 15, "diente", "dientes alineados en una boca"),
    radical(212, "龍", "竜", 16, "dragon", "dragon con cresta, cuerpo y cola"),
    radical(213, "龜", "亀, 龟", 16, "tortuga", "caparazon con cabeza y patas"),
    radical(214, "龠", "", 17, "flauta", "tubos alineados como una flauta antigua"),
]


VOCABULARY_MNEMONICS = {
    2: "会 tiene una tapa arriba y trazos reunidos debajo; imagina elementos bajo un mismo techo para encontrarse.",
    3: "青 combina crecimiento arriba y una zona de color abajo; usa esa mancha limpia como pista de azul.",
    4: "赤 parece una figura grande sobre fuego; el calor te lleva al rojo.",
    5: "明 es sol 日 junto a luna 月; dos luces juntas hacen algo brillante.",
    6: "秋 junta cereal 禾 y fuego 火; campos dorados y quemas de cosecha apuntan al otono.",
    7: "開 muestra una puerta 門 con algo que se separa dentro; visualizala abriendose.",
    8: "開 mantiene las dos hojas de puerta 門; recuerda la accion de abrirla.",
    10: "朝 junta sol 日 y luna 月 entre trazos de movimiento; es el cambio de noche a manana.",
    11: "朝 es manana y 飯 lleva comida 食; juntos forman la comida de la manana: desayuno.",
    13: "足 tiene una boca/cuerpo arriba y una huella abajo; es la parte que pisa: pie o pierna.",
    14: "明 aporta claridad y 日 es el dia; el dia claro que viene es manana.",
    16: "遊 lleva el camino 辶 rodeando una figura con bandera; salir por el camino para jugar.",
    17: "温 lleva agua 氵 y una forma de sol/plato; imagina agua templada para recordar calido.",
    18: "頭 combina 豆, como un cuenco, con 頁 cabeza; la parte alta del cuerpo es la cabeza.",
    19: "新 junta madera 木 y hacha 斤 junto a 立; madera recien cortada da la idea de nuevo.",
    21: "暑 pone el sol 日 sobre una figura; el sol encima de todo marca calor del aire.",
    22: "厚 parece un acantilado 厂 cubriendo capas; varias capas recuerdan algo grueso.",
    23: "後 lleva pasos 彳 y una parte que queda atras; recuerda despues o detras.",
    24: "貴 sugiere valor con 貝 y 方 apunta a una direccion/persona; forma respetuosa para tu.",
    25: "兄 pone una boca 口 sobre piernas 儿; imagina al hermano mayor hablando desde arriba.",
    26: "姉 lleva mujer 女 junto a una forma de ciudad/mercado 市; marca hermana mayor.",
    30: "浴 combina agua 氵 y valle 谷; agua bajando por un valle sirve para banarse.",
    31: "危 parece una persona en una forma inestable sobre acantilado; eso senala peligro.",
    32: "甘 parece una boca con una linea dentro; algo dulce esta dentro de la boca.",
    34: "雨 muestra una nube/marco con gotas debajo; es lluvia.",
    35: "洗 lleva agua 氵 y primero 先; echar agua primero ayuda a lavar.",
    36: "有 parece una mano sobre carne/luna 月; algo en la mano es algo que hay o se tiene.",
    38: "歩 combina detener 止 con trazos de paso; una serie de pasos es caminar.",
    40: "良 tiene una forma equilibrada y completa; usala como pista visual de bueno.",
    42: "言 apila lineas sobre una boca; son palabras saliendo al decir.",
    43: "家 pone un techo 宀 sobre un cerdo 豕; una casa antigua con animal dentro.",
    44: "行 parece dos columnas de una calle; moverse por esa calle es ir.",
    47: "池 junta agua 氵 y una forma curva 也; agua retenida en una curva es un estanque.",
    48: "医 parece caja de herramientas medicas y 者 marca persona; juntos apuntan a medico.",
    49: "椅 usa madera 木 y 子; imagina un objeto de madera para sentarse: silla.",
    50: "忙 lleva corazon 忄 junto a perder 亡; el corazon se pierde cuando estas ocupado.",
    51: "痛 lleva enfermedad 疒 con una pieza central punzante; eso fija dolor.",
    52: "一 es un unico trazo horizontal; una sola cosa.",
    53: "一 es uno y 日 es dia/sol; juntos son un dia.",
    54: "一 marca el numero uno y 番 marca turno; el turno numero uno es el primero.",
    56: "五 es cinco y 日 es dia; quinto dia o cinco dias.",
    57: "一 es uno y 緒 parece hilos 糸 reunidos; hilos en uno recuerdan juntos.",
    58: "五 marca cinco; con つ se fija el conteo nativo de cinco cosas.",
    60: "今 parece una tapa sobre una marca corta; senala el punto del tiempo: ahora.",
    61: "意 pone corazon bajo sonido y 味 boca con sabor; el sabor mental de una palabra es significado.",
    62: "妹 lleva mujer 女 y 未, algo aun no maduro; hermana menor.",
    64: "入 parece algo entrando y 口 es una abertura; juntos forman una entrada.",
    67: "入 muestra entrar; con れる recuerda meter algo hacia dentro.",
    68: "色 es una forma visible que distingue; usala como pista de color.",
    69: "色 es color y 々 repite el kanji anterior; muchos colores dan varios.",
    70: "上 tiene una linea base y una marca encima; indica arriba.",
    71: "後 conserva pasos 彳 y algo que queda atras; con ろ apunta a detras.",
    72: "薄 junta hierba 艹, agua 氵 y medida; una capa mojada y extendida queda fina.",
    73: "歌 repite 可 como bocas y suma 欠, boca abierta; de ahi sale una cancion.",
    74: "歌 muestra bocas y una persona abriendo la boca; recuerda cantar.",
    75: "内 encierra una persona dentro de un marco; eso es interior o casa.",
    76: "生 parece un brote saliendo del suelo; nacer o vivir.",
    77: "海 lleva agua 氵 y 毎, algo abundante; mucha agua por todas partes es mar.",
    78: "売 parece un puesto con algo encima y piernas abajo; mercancia puesta para vender.",
    79: "上 es arriba y 着 es ropa puesta; prenda que va encima: chaqueta.",
    80: "絵 lleva hilo 糸 y reunir 会; lineas reunidas forman un dibujo.",
    81: "映 sugiere imagen iluminada y 画 es dibujo; imagen proyectada: pelicula.",
    82: "映画 es pelicula y 館 es edificio; edificio para peliculas: cine.",
    83: "英 identifica lo ingles y 語 son palabras; idioma ingles.",
    85: "駅 combina caballo 馬 y una medida/parada; lugar donde se detiene el viaje: estacion.",
    87: "円 encierra una forma redondeada; moneda yen.",
    88: "鉛 lleva metal 金 y 筆 lleva bambu 竹 de pincel; metal y punta para escribir: lapiz.",
    89: "御 tiene pasos y marcas de control; funciona como prefijo que acompana con respeto.",
    90: "美 es belleza y 味 es boca con sabor; sabor bonito: delicioso.",
    91: "大 es una persona con brazos abiertos; algo grande.",
    93: "母 parece un cuerpo materno con puntos interiores; madre.",
    94: "菓 lleva hierba/fruto y 子 lo vuelve cosa pequena; dulce o pastel.",
    95: "金 muestra pepitas bajo una tapa; metal que tambien recuerda dinero.",
    96: "起 junta correr 走 y uno mismo 己; levantar el propio cuerpo y ponerse en marcha.",
    97: "置 pone una red 罒 sobre recto 直; dejar algo fijo en su sitio.",
    98: "奥 parece una zona cubierta y profunda de la casa; recuerda la persona de dentro: esposa de otro.",
    99: "送 lleva camino 辶; mandar algo es enviarlo por el camino.",
    100: "酒 junta agua 氵 y jarra 酉; liquido en jarra: alcohol o sake.",
    101: "皿 es un plato visto de frente; plato.",
    102: "伯 lleva persona 亻 y 白, y 父 es padre; rama familiar del padre: tio.",
    104: "押 lleva mano 扌 y una forma dura 甲; empujar con la mano.",
    105: "遅 lleva camino 辶 y un cuerpo pesado; avanzar despacio o tarde.",
    106: "茶 tiene hierba 艹 arriba y una planta/persona debajo; planta preparada: te.",
    107: "手 es mano y 洗 es lavar con agua 氵; mano-lavar apunta a lavabo o servicio.",
    108: "父 cruza dos trazos como brazos de adulto; padre.",
    109: "弟 tiene arco/cuerda y marcas de rango menor; hermano menor.",
    110: "男 junta campo 田 y fuerza 力; hombre trabajando el campo.",
    111: "男 es hombre y 子 es nino; juntos forman chico.",
    112: "一 marca uno y 昨日 es ayer; un ayer mas atras es anteayer.",
    113: "一 marca uno, 昨 pasado y 年 ano; el ano anterior al pasado.",
    114: "大 es grande y 人 persona; persona grande: adulto.",
    115: "腹 lleva carne 月 y una parte central repetida; zona carnosa central: barriga.",
    116: "同 encierra una boca bajo el mismo marco; cosas dentro del mismo sitio son iguales.",
    117: "兄 pone boca 口 sobre piernas 儿; hermano mayor.",
    118: "姉 lleva mujer 女 y una forma de ciudad/mercado 市; hermana mayor.",
    119: "伯 lleva persona 亻 y 白, y 母 es madre; rama familiar de la madre: tia.",
    121: "弁 parece una tapa/caja y 当 marca ajuste; caja preparada para comer: bento.",
    122: "覚 pone una parte de aprender arriba y 見 ver abajo; recordar es volver a ver en la mente.",
    123: "重 muestra capas apiladas sobre un eje; capas apiladas pesan.",
    124: "面 es cara/superficie y 白 blanco; algo que ilumina la cara: interesante.",
    125: "泳 junta agua 氵 y largo 永; moverse largo dentro del agua es nadar.",
    126: "降 lleva colina 阝 y trazos que bajan; descender o bajarse.",
    127: "終 lleva hilo 糸 y final/invierno 冬; el hilo llega al final.",
    128: "音 es sonido y 楽 sugiere placer; sonido agradable: musica.",
    129: "女 es una figura arrodillada; mujer.",
    130: "女 es mujer y 子 es nino; juntos forman chica.",
    131: "回 es caja dentro de caja, como una vuelta completa; contador de veces.",
    132: "階 lleva colina 阝 y todos 皆; niveles apilados: piso.",
    133: "外 es fuera y 国 es pais cerrado; pais de fuera: extranjero.",
    134: "外国 es pais extranjero y 人 persona; persona de fuera: extranjero.",
    135: "会 es reunion y 社 es altar/sociedad; personas reunidas en una entidad: empresa.",
    136: "階 son niveles y 段 son tramos; niveles por tramos: escaleras.",
    137: "買 es comprar con dinero 貝 y 物 es cosa; cosas compradas: compras.",
    138: "買 pone una red/bolsa sobre dinero 貝; entregar dinero para comprar.",
    139: "返 lleva camino 辶 y una mano que vuelve; devolver algo por el camino.",
    140: "帰 sugiere volver por el camino hacia una casa; regresar a casa.",
    141: "顔 usa 頁, cabeza, con rasgos delante; la parte frontal es la cara.",
    143: "鍵 lleva metal 金 y construir 建; pieza metalica que abre: llave.",
    144: "書 muestra mano/pincel sobre una superficie; escribir.",
    145: "学 tiene un nino 子 bajo una cubierta de escuela y 生 es vida que brota; vida que aprende: estudiante.",
    146: "月 es luna y tambien mes; contador de meses.",
    149: "傘 se dibuja como un techo con personas debajo; paraguas.",
    150: "貸 combina persona, cambio y dinero 貝; dejar dinero o algo a otro: prestar.",
    151: "風 encierra un insecto movido por aire; viento.",
    152: "風 es viento y 邪 es algo torcido/malo; mal que llega con viento: resfriado.",
    153: "家 es casa y 族 es grupo con bandera/flecha; grupo de una casa: familia.",
    154: "方 parece una bandera apuntando en una direccion; usado aqui para persona/lado.",
    155: "片 es fragmento, 仮 prestado y 名 nombre; nombres prestados en trazos angulosos: katakana.",
    168: "学 es aprender y 校 parece madera/cruce de edificio; lugar de aprender: escuela.",
    169: "角 parece un cuerno con base; un cuerno marca una esquina.",
    170: "家 es casa y 内 es dentro; persona de dentro de casa: mi esposa.",
    171: "鞄 lleva cuero 革 y envolver 包; bolsa hecha de cuero que envuelve cosas.",
    172: "花 lleva hierba 艹 y cambio 化; 瓶 es recipiente: jarron para flores.",
    173: "冠 tiene cubierta 冖 sobre una forma de corona; ponersela en la cabeza.",
    174: "紙 lleva hilo 糸 y氏; fibras finas convertidas en papel.",
    176: "火 es fuego y 曜日 es dia de la semana; martes, dia de fuego.",
    177: "辛 parece una aguja u hoja puntiaguda; sensacion picante.",
    178: "体 junta persona 亻 y 本 base/origen; la base de la persona es el cuerpo.",
    179: "借 lleva persona 亻 y 昔 antiguo; tomar algo de otra persona por un tiempo.",
    181: "軽 lleva vehiculo 車 y una parte ligera; algo que no pesa.",
    183: "川 son tres lineas de corriente; rio.",
    184: "側 lleva persona 亻 y regla/lado 則; lado de algo.",
    185: "可 sugiere boca posible y 愛 contiene corazon; algo que despierta carino: mono/cute.",
    186: "漢 identifica lo chino/Han y 字 es letra bajo techo; caracteres kanji.",
    187: "木 dibuja tronco, ramas y raices; arbol.",
    188: "黄 es amarillo y 色 color; color amarillo.",
    189: "消 lleva agua 氵 y pequeno brillo 肖; agua que apaga o hace desaparecer.",
    190: "聞 pone oreja 耳 dentro de puerta 門; escuchar a traves de la puerta.",
    191: "北 son dos figuras espalda contra espalda; orientate hacia el norte.",
    193: "汚 lleva agua 氵 y una forma torcida; agua torcida o manchada: sucio.",
    194: "喫 es boca que consume, 茶 es te y 店 tienda; tienda para tomar te/cafe.",
    195: "切 lleva cuchillo 刀 y 七; cortar, y 手 mano senala sello manipulado.",
    196: "切 es cortar y 符 es marca de bambu; billete cortado o marcado.",
    197: "昨 lleva sol 日 y marca de antes; ayer.",
    198: "九 se curva como el ultimo trazo antes de cerrar la cuenta; nueve.",
    199: "牛 es vaca y 肉 carne; carne de vaca.",
    200: "牛 es vaca y 乳 sugiere leche; leche de vaca.",
    201: "今 es ahora y 日 dia; el dia de ahora: hoy.",
    202: "教 muestra accion de ensenar y 室 es cuarto bajo techo; aula.",
    203: "兄 es hermano mayor y 弟 hermano menor; hermanos.",
    204: "去 es irse y 年 ano; el ano que se fue: ano pasado.",
    205: "嫌 lleva mujer 女 y 兼, forma apretada/doble; una sensacion que rechazas: disgusto.",
    206: "切 lleva cuchillo 刀 junto a 七; la hoja corta.",
    207: "着 parece ropa cayendo sobre el cuerpo con 目 abajo; ponerse ropa.",
    208: "来 parece un arbol con granos que se acercan al centro; venir.",
    212: "銀 es plata/metal y 行 camino; lugar por donde se mueve el dinero: banco.",
    213: "金 es metal/oro y 曜日 es dia de semana; viernes, dia del metal.",
    214: "九 se curva como una cuenta casi completa; nueve.",
    215: "薬 lleva hierba 艹 y una parte de musica/placer; hierba que cura: medicina.",
    216: "下 marca lo que queda debajo; en 下さい imagina bajar o entregar algo hacia ti.",
    217: "果 es fruto en un arbol y 物 cosa; cosa-fruto: fruta.",
    218: "口 es un cuadrado abierto como una boca.",
    219: "靴 lleva cuero 革 y cambio 化; cuero transformado en zapato.",
    220: "靴 es zapato y 下 es abajo; lo que va bajo el zapato: calcetines.",
    221: "国 es un recinto 囗 con jade 玉 dentro; territorio cerrado: pais.",
    222: "曇 pone sol 日 sobre nubes 云; el sol tapado da nublado.",
    223: "暗 junta sol 日 y sonido 音; cuando el sol queda apagado, esta oscuro.",
    227: "車 dibuja rueda y eje vistos de frente; vehiculo o coche.",
    228: "黒 muestra una forma ennegrecida sobre fuego 灬; negro por humo.",
    229: "今 es ahora y 朝 manana; esta manana.",
    230: "消 lleva agua 氵 y pequeno brillo 肖; apagar o borrar como agua sobre luz.",
    232: "結 lleva hilo 糸 atado y 婚 mujer con ocaso; union atada: matrimonio.",
    233: "月 es luna y 曜日 dia de semana; lunes, dia de la luna.",
    234: "玄 es oscuro/misterioso y 関 es puerta/barrera; entrada de la casa.",
    235: "元 es origen y 気 vapor/aire; energia que sale del origen: salud/vigor.",
    236: "個 lleva persona 亻 y solido 固; un objeto individual contado uno a uno.",
    237: "五 son trazos cruzados de cuenta; cinco.",
    238: "語 lleva palabras 言 y una boca 吾; conjunto de palabras: idioma.",
    239: "公 es publico y 園 es recinto ajardinado; parque.",
    240: "交 es cruce y 番 turno; puesto policial del barrio/cruce.",
    241: "声 parece una voz que sale de una parte superior; voz.",
    244: "午 marca mediodia y 後 despues; despues del mediodia: tarde.",
    245: "九 es nueve y 日 dia; noveno dia o nueve dias.",
    246: "九 es nueve; con つ fija el conteo nativo de nueve cosas.",
    247: "主 es senor/principal y 人 persona; persona principal de la casa: marido de otro.",
    248: "午 es mediodia y 前 delante/antes; antes del mediodia: manana a.m.",
    249: "答 lleva bambu 竹 y reunir 合; una respuesta reunida en una tablilla: contestar.",
}


for word_id, month_name in [
    (156, "enero"),
    (157, "febrero"),
    (158, "marzo"),
    (159, "abril"),
    (160, "mayo"),
    (161, "junio"),
    (162, "julio"),
    (163, "agosto"),
    (164, "septiembre"),
    (165, "octubre"),
    (166, "noviembre"),
    (167, "diciembre"),
]:
    VOCABULARY_MNEMONICS[word_id] = (
        "El numero delante de 月 marca el mes; 月 es luna/mes, asi se fija "
        + month_name
        + "."
    )


def column_exists(connection, table_name, column_name):
    rows = connection.execute("PRAGMA table_info(" + table_name + ")").fetchall()
    return any(row[1] == column_name for row in rows)


def has_kanji(value):
    return any("\u3400" <= character <= "\u9fff" for character in value or "")


def ensure_schema(connection):
    if not column_exists(connection, "vocabulary", "mnemonic_es"):
        connection.execute(
            "ALTER TABLE vocabulary ADD COLUMN mnemonic_es TEXT NOT NULL DEFAULT ''"
        )

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS kanji_radicals (
            id INTEGER PRIMARY KEY,
            radical TEXT NOT NULL,
            variants TEXT NOT NULL DEFAULT '',
            strokes INTEGER NOT NULL,
            name_es TEXT NOT NULL,
            mnemonic_es TEXT NOT NULL,
            kind TEXT NOT NULL DEFAULT 'kangxi'
        )
        """
    )


def seed_radicals(connection):
    connection.execute("DELETE FROM kanji_radicals")
    connection.executemany(
        """
        INSERT INTO kanji_radicals (
            id, radical, variants, strokes, name_es, mnemonic_es, kind
        )
        VALUES (:id, :radical, :variants, :strokes, :name_es, :mnemonic_es, 'kangxi')
        """,
        RADICALS,
    )


def seed_vocabulary_mnemonics(connection):
    rows = connection.execute(
        """
        SELECT id, kanji
        FROM vocabulary
        WHERE id <= 250
        ORDER BY id ASC
        """
    ).fetchall()
    required_ids = {row[0] for row in rows if has_kanji(row[1])}
    available_ids = set(VOCABULARY_MNEMONICS.keys())
    missing_ids = sorted(required_ids - available_ids)
    extra_ids = sorted(available_ids - required_ids)

    if missing_ids:
        raise RuntimeError("Missing vocabulary mnemonics for ids: " + str(missing_ids))

    if extra_ids:
        raise RuntimeError("Vocabulary mnemonics reference unknown ids: " + str(extra_ids))

    connection.executemany(
        """
        UPDATE vocabulary
        SET mnemonic_es = ''
        WHERE id = ?
        """,
        [(word_id,) for word_id in required_ids],
    )
    connection.executemany(
        """
        UPDATE vocabulary
        SET mnemonic_es = ?
        WHERE id = ?
        """,
        [(text, word_id) for word_id, text in VOCABULARY_MNEMONICS.items()],
    )


def main():
    if len(RADICALS) != 214:
        raise RuntimeError("Expected 214 radicals, got " + str(len(RADICALS)))

    with sqlite3.connect(DB_PATH) as connection:
        ensure_schema(connection)
        seed_radicals(connection)
        seed_vocabulary_mnemonics(connection)

    print("Seeded 214 radicals and " + str(len(VOCABULARY_MNEMONICS)) + " vocabulary mnemonics.")


if __name__ == "__main__":
    main()
