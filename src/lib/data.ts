export type Mode = 'explorer' | 'vecino'

export interface StateData {
  name: string
  abbr: string
  featured?: boolean
  municipalities: string[]
}

export const STATES_DATA: StateData[] = [
  { name: 'Aguascalientes', abbr: 'AGS', municipalities: ['Aguascalientes', 'Asientos', 'Calvillo', 'Cosío', 'El Llano', 'Jesús María', 'Pabellón de Arteaga', 'Rincón de Romos', 'San Francisco de los Romo', 'San José de Gracia', 'Tepezalá'] },
  { name: 'Baja California', abbr: 'BC', featured: true, municipalities: ['Ensenada', 'Mexicali', 'Playas de Rosarito', 'San Felipe', 'San Quintín', 'Tecate', 'Tijuana'] },
  { name: 'Baja California Sur', abbr: 'BCS', featured: true, municipalities: ['Comondú', 'La Paz', 'Loreto', 'Los Cabos', 'Mulegé'] },
  { name: 'Campeche', abbr: 'CAM', municipalities: ['Calakmul', 'Calkiní', 'Campeche', 'Candelaria', 'Carmen', 'Champotón', 'Dzitbalché', 'Escárcega', 'Hecelchakán', 'Hopelchén', 'Palizada', 'Seybaplaya', 'Tenabo'] },
  { name: 'Chiapas', abbr: 'CHIS', municipalities: ['Acacoyagua', 'Acala', 'Acapetahua', 'Aldama', 'Altamirano', 'Amatenango de la Frontera', 'Amatenango del Valle', 'Amatán', 'Arriaga', 'Bejucal de Ocampo', 'Bella Vista', 'Benemérito de las Américas', 'Berriozábal', 'Bochil', 'Cacahoatán', 'Capitán Luis Ángel Vidal', 'Catazajá', 'Chalchihuitán', 'Chamula', 'Chanal', 'Chapultenango', 'Chenalhó', 'Chiapa de Corzo', 'Chiapilla', 'Chicoasén', 'Chicomuselo', 'Chilón', 'Cintalapa de Figueroa', 'Coapilla', 'Comitán de Domínguez', 'Copainalá', 'El Bosque', 'El Parral', 'El Porvenir', 'Emiliano Zapata', 'Escuintla', 'Francisco León', 'Frontera Comalapa', 'Frontera Hidalgo', 'Honduras de la Sierra', 'Huehuetán', 'Huitiupán', 'Huixtla', 'Huixtán', 'Ixhuatán', 'Ixtacomitán', 'Ixtapa', 'Ixtapangajoya', 'Jiquipilas', 'Jitotol', 'Juárez', 'La Concordia', 'La Grandeza', 'La Independencia', 'La Libertad', 'La Trinitaria', 'Larráinzar', 'Las Margaritas', 'Las Rosas', 'Mapastepec', 'Maravilla Tenejapa', 'Marqués de Comillas', 'Mazapa de Madero', 'Mazatán', 'Metapa', 'Mezcalapa', 'Mitontic', 'Montecristo de Guerrero', 'Motozintla', 'Nicolás Ruíz', 'Ocosingo', 'Ocotepec', 'Ocozocoautla de Espinosa', 'Ostuacán', 'Osumacinta', 'Oxchuc', 'Palenque', 'Pantelhó', 'Pantepec', 'Pichucalco', 'Pijijiapan', 'Pueblo Nuevo Solistahuacán', 'Rayón', 'Reforma', 'Rincón Chamula San Pedro', 'Sabanilla', 'Salto de Agua', 'San Andrés Duraznal', 'San Cristóbal de las Casas', 'San Fernando', 'San Juan Cancuc', 'San Lucas', 'Santiago el Pinar', 'Siltepec', 'Simojovel', 'Sitalá', 'Socoltenango', 'Solosuchiapa', 'Soyaló', 'Suchiapa', 'Suchiate', 'Sunuapa', 'Tapachula', 'Tapalapa', 'Tapilula', 'Tecpatán', 'Tenejapa', 'Teopisca', 'Tila', 'Tonalá', 'Totolapa', 'Tumbalá', 'Tuxtla Chico', 'Tuxtla Gutiérrez', 'Tuzantán', 'Tzimol', 'Unión Juárez', 'Venustiano Carranza', 'Villa Comaltitlán', 'Villa Corzo', 'Villaflores', 'Yajalón', 'Zinacantán', 'Ángel Albino Corzo'] },
  { name: 'Chihuahua', abbr: 'CHIH', municipalities: ['Ahumada', 'Aldama', 'Allende', 'Aquiles Serdán', 'Ascensión', 'Bachíniva', 'Balleza', 'Batopilas de Manuel Gómez Morín', 'Bocoyna', 'Buenaventura', 'Camargo', 'Carichí', 'Casas Grandes', 'Chihuahua', 'Chínipas', 'Coronado', 'Coyame del Sotol', 'Cuauhtémoc', 'Cusihuiriachi', 'Delicias', 'Dr. Belisario Domínguez', 'El Tule', 'Galeana', 'Gran Morelos', 'Guachochi', 'Guadalupe', 'Guadalupe y Calvo', 'Guazapares', 'Guerrero', 'Gómez Farías', 'Hidalgo del Parral', 'Huejotitán', 'Ignacio Zaragoza', 'Janos', 'Jiménez', 'Julimes', 'Juárez', 'La Cruz', 'López', 'Madera', 'Maguarichi', 'Manuel Benavides', 'Matachí', 'Matamoros', 'Meoqui', 'Morelos', 'Moris', 'Namiquipa', 'Nonoava', 'Nuevo Casas Grandes', 'Ocampo', 'Ojinaga', 'Praxedis G. Guerrero', 'Riva Palacio', 'Rosales', 'San Francisco de Borja', 'San Francisco de Conchos', 'San Francisco del Oro', 'Santa Bárbara', 'Santa Isabel', 'Satevó', 'Saucillo', 'Temósachic', 'Urique', 'Uruachi', 'Valle de Zaragoza', 'Valle del Rosario'] },
  { name: 'Ciudad de México', abbr: 'CDMX', municipalities: ['Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa de Morelos', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'La Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta', 'Tlalpan', 'Tláhuac', 'Venustiano Carranza', 'Xochimilco', 'Álvaro Obregón'] },
  { name: 'Coahuila', abbr: 'COAH', municipalities: ['Abasolo', 'Acuña', 'Allende', 'Arteaga', 'Candela', 'Castaños', 'Cuatro Ciénegas', 'Escobedo', 'Francisco I. Madero', 'Frontera', 'General Cepeda', 'Guerrero', 'Hidalgo', 'Jiménez', 'Juárez', 'Lamadrid', 'Matamoros', 'Monclova', 'Morelos', 'Múzquiz', 'Nadadores', 'Nava', 'Ocampo', 'Parras', 'Piedras Negras', 'Progreso', 'Ramos Arizpe', 'Sabinas', 'Sacramento', 'Saltillo', 'San Buenaventura', 'San Juan de Sabinas', 'San Pedro', 'Sierra Mojada', 'Torreón', 'Viesca', 'Villa Unión', 'Zaragoza'] },
  { name: 'Colima', abbr: 'COL', municipalities: ['Armería', 'Colima', 'Comala', 'Coquimatlán', 'Cuauhtémoc', 'Ixtlahuacán', 'Manzanillo', 'Minatitlán', 'Tecomán', 'Villa de Álvarez'] },
  { name: 'Durango', abbr: 'DGO', municipalities: ['Canatlán', 'Canelas', 'Coneto de Comonfort', 'Cuencamé', 'Durango', 'El Oro', 'General Simón Bolívar', 'Guadalupe Victoria', 'Guanaceví', 'Gómez Palacio', 'Hidalgo', 'Indé', 'Lerdo', 'Mapimí', 'Mezquital', 'Nazas', 'Nombre de Dios', 'Nuevo Ideal', 'Ocampo', 'Otáez', 'Peñón Blanco', 'Poanas', 'Pueblo Nuevo', 'Pánuco de Coronado', 'Rodeo', 'San Bernardo', 'San Dimas', 'San Juan de Guadalupe', 'San Juan del Río', 'San Luis del Cordero', 'San Pedro del Gallo', 'Santa Clara', 'Santiago Papasquiaro', 'Súchil', 'Tamazula', 'Tepehuanes', 'Tlahualilo', 'Topia', 'Vicente Guerrero'] },
  { name: 'Estado de México', abbr: 'MEX', municipalities: ['Acambay de Ruíz Castañeda', 'Acolman', 'Aculco', 'Almoloya de Alquisiras', 'Almoloya de Juárez', 'Almoloya del Río', 'Amanalco', 'Amatepec', 'Amecameca', 'Apaxco', 'Atenco', 'Atizapán', 'Atizapán de Zaragoza', 'Atlacomulco', 'Atlautla', 'Axapusco', 'Ayapango', 'Calimaya', 'Capulhuac', 'Chalco', 'Chapa de Mota', 'Chapultepec', 'Chiautla', 'Chicoloapan', 'Chiconcuac', 'Chimalhuacán', 'Coacalco de Berriozábal', 'Coatepec Harinas', 'Cocotitlán', 'Coyotepec', 'Cuautitlán', 'Cuautitlán Izcalli', 'Donato Guerra', 'Ecatepec de Morelos', 'Ecatzingo', 'El Oro', 'Huehuetoca', 'Hueypoxtla', 'Huixquilucan', 'Isidro Fabela', 'Ixtapaluca', 'Ixtapan de la Sal', 'Ixtapan del Oro', 'Ixtlahuaca', 'Jaltenco', 'Jilotepec', 'Jilotzingo', 'Jiquipilco', 'Jocotitlán', 'Joquicingo', 'Juchitepec', 'La Paz', 'Lerma', 'Luvianos', 'Malinalco', 'Melchor Ocampo', 'Metepec', 'Mexicaltzingo', 'Morelos', 'Naucalpan de Juárez', 'Nextlalpan', 'Nezahualcóyotl', 'Nicolás Romero', 'Nopaltepec', 'Ocoyoacac', 'Ocuilan', 'Otumba', 'Otzoloapan', 'Otzolotepec', 'Ozumba', 'Papalotla', 'Polotitlán', 'Rayón', 'San Antonio la Isla', 'San Felipe del Progreso', 'San José del Rincón', 'San Martín de las Pirámides', 'San Mateo Atenco', 'San Simón de Guerrero', 'Santo Tomás', 'Soyaniquilpan de Juárez', 'Sultepec', 'Tecámac', 'Tejupilco', 'Temamatla', 'Temascalapa', 'Temascalcingo', 'Temascaltepec', 'Temoaya', 'Tenancingo', 'Tenango del Aire', 'Tenango del Valle', 'Teoloyucan', 'Teotihuacán', 'Tepetlaoxtoc', 'Tepetlixpa', 'Tepotzotlán', 'Tequixquiac', 'Texcaltitlán', 'Texcalyacac', 'Texcoco', 'Tezoyuca', 'Tianguistenco', 'Timilpan', 'Tlalmanalco', 'Tlalnepantla de Baz', 'Tlatlaya', 'Toluca', 'Tonanitla', 'Tonatico', 'Tultepec', 'Tultitlán', 'Valle de Bravo', 'Valle de Chalco Solidaridad', 'Villa Guerrero', 'Villa Victoria', 'Villa de Allende', 'Villa del Carbón', 'Xalatlaco', 'Xonacatlán', 'Zacazonapan', 'Zacualpan', 'Zinacantepec', 'Zumpahuacán', 'Zumpango'] },
  { name: 'Guanajuato', abbr: 'GTO', municipalities: ['Abasolo', 'Acámbaro', 'Apaseo el Alto', 'Apaseo el Grande', 'Atarjea', 'Celaya', 'Comonfort', 'Coroneo', 'Cortazar', 'Cuerámaro', 'Doctor Mora', 'Dolores Hidalgo Cuna de la Independencia Nacional', 'Guanajuato', 'Huanímaro', 'Irapuato', 'Jaral del Progreso', 'Jerécuaro', 'León', 'Manuel Doblado', 'Moroleón', 'Ocampo', 'Pueblo Nuevo', 'Purísima del Rincón', 'Pénjamo', 'Romita', 'Salamanca', 'Salvatierra', 'San Diego de la Unión', 'San Felipe', 'San Francisco del Rincón', 'San José de Iturbide', 'San Luis de la Paz', 'San Miguel de Allende', 'Santa Catarina', 'Santa Cruz de Juventino Rosas', 'Santiago Maravatío', 'Silao de la Victoria', 'Tarandacuao', 'Tarimoro', 'Tierra Blanca', 'Uriangato', 'Valle de Santiago', 'Victoria', 'Villagrán', 'Xichú', 'Yuriria'] },
  { name: 'Guerrero', abbr: 'GRO', municipalities: ['Acapulco de Juárez', 'Acatepec', 'Ahuacuotzingo', 'Ajuchitlán del Progreso', 'Alcozauca de Guerrero', 'Alpoyeca', 'Apaxtla de Castrejón', 'Arcelia', 'Atenango del Río', 'Atlamajalcingo del Monte', 'Atlixtac', 'Atoyac de Álvarez', 'Ayutla de los Libres', 'Azoyú', 'Benito Juárez', 'Buenavista de Cuéllar', 'Chilapa de Álvarez', 'Chilpancingo de los Bravo', 'Coahuayutla de José María Izazaga', 'Cochoapa el Grande', 'Cocula', 'Copala', 'Copalillo', 'Copanatoyac', 'Coyuca de Benítez', 'Coyuca de Catalán', 'Cuajinicuilapa', 'Cualác', 'Cuautepec', 'Cuetzala del Progreso', 'Cutzamala de Pinzón', 'Eduardo Neri', 'Florencio Villarreal', 'General Canuto A. Neri', 'General Heliodoro Castillo', 'Huamuxtitlán', 'Huitzuco de los Figueroa', 'Iguala de la Independencia', 'Igualapa', 'Iliatenco', 'Ixcateopan de Cuauhtémoc', 'José Joaquín de Herrera', 'Juan R. Escudero', 'Juchitán', 'La Unión de Isidoro Montes de Oca', 'Las Vigas', 'Leonardo Bravo', 'Malinaltepec', 'Marquelia', 'Metlatónoc', 'Mochitlán', 'Mártir de Cuilapan', 'Olinalá', 'Ometepec', 'Pedro Ascencio Alquisiras', 'Petatlán', 'Pilcaya', 'Pungarabato', 'Quechultenango', 'San Luis Acatlán', 'San Marcos', 'San Miguel Totolapan', 'San Nicolás', 'Santa Cruz del Rincón', 'Taxco de Alarcón', 'Tecoanapa', 'Teloloapan', 'Tepecoacuilco de Trujano', 'Tetipac', 'Tixtla de Guerrero', 'Tlacoachistlahuaca', 'Tlacoapa', 'Tlalchapa', 'Tlalixtaquilla de Maldonado', 'Tlapa de Comonfort', 'Tlapehuala', 'Técpan de Galeana', 'Xalpatláhuac', 'Xochihuehuetlán', 'Xochistlahuaca', 'Zapotitlán Tablas', 'Zihuatanejo de Azueta', 'Zirándaro', 'Zitlala', 'Ñuu Savi'] },
  { name: 'Hidalgo', abbr: 'HGO', municipalities: ['Acatlán', 'Acaxochitlán', 'Actopan', 'Agua Blanca de Iturbide', 'Ajacuba', 'Alfajayucan', 'Almoloya', 'Apan', 'Atitalaquia', 'Atlapexco', 'Atotonilco de Tula', 'Atotonilco el Grande', 'Calnali', 'Cardonal', 'Chapantongo', 'Chapulhuacán', 'Chilcuautla', 'Cuautepec de Hinojosa', 'El Arenal', 'Eloxochitlán', 'Emiliano Zapata', 'Epazoyucan', 'Francisco I. Madero', 'Huasca de Ocampo', 'Huautla', 'Huazalingo', 'Huehuetla', 'Huejutla de Reyes', 'Huichapan', 'Ixmiquilpan', 'Jacala de Ledezma', 'Jaltocán', 'Juárez Hidalgo', 'La Misión', 'Lolotla', 'Metepec', 'Metztitlán', 'Mineral de la Reforma', 'Mineral del Chico', 'Mineral del Monte', 'Mixquiahuala de Juárez', 'Molango de Escamilla', 'Nicolás Flores', 'Nopala de Villagrán', 'Omitlán de Juárez', 'Pachuca de Soto', 'Pacula', 'Pisaflores', 'Progreso de Obregón', 'San Agustín Metzquititlán', 'San Agustín Tlaxiaca', 'San Bartolo Tutotepec', 'San Felipe Orizatlán', 'San Salvador', 'Santiago Tulantepec de Lugo Guerrero', 'Santiago de Anaya', 'Singuilucan', 'Tasquillo', 'Tecozautla', 'Tenango de Doria', 'Tepeapulco', 'Tepehuacán de Guerrero', 'Tepeji del Río de Ocampo', 'Tepetitlán', 'Tetepango', 'Tezontepec de Aldama', 'Tianguistengo', 'Tizayuca', 'Tlahuelilpan', 'Tlahuiltepa', 'Tlanalapa', 'Tlanchinol', 'Tlaxcoapan', 'Tolcayuca', 'Tula de Allende', 'Tulancingo de Bravo', 'Villa de Tezontepec', 'Xochiatipan', 'Xochicoatlán', 'Yahualica', 'Zacualtipán de Ángeles', 'Zapotlán de Juárez', 'Zempoala', 'Zimapán'] },
  { name: 'Jalisco', abbr: 'JAL', municipalities: ['Acatic', 'Acatlán de Juárez', 'Ahualulco de Mercado', 'Amacueca', 'Amatitán', 'Ameca', 'Arandas', 'Atemajac de Brizuela', 'Atengo', 'Atenguillo', 'Atotonilco el Alto', 'Atoyac', 'Autlán de Navarro', 'Ayotlán', 'Ayutla', 'Bolaños', 'Cabo Corrientes', 'Casimiro Castillo', 'Cañadas de Obregón', 'Chapala', 'Chimaltitán', 'Chiquilistlán', 'Cihuatlán', 'Cocula', 'Colotlán', 'Concepción de Buenos Aires', 'Cuautitlán de García Barragán', 'Cuautla', 'Cuquío', 'Degollado', 'Ejutla', 'El Arenal', 'El Grullo', 'El Limón', 'El Salto', 'Encarnación de Díaz', 'Etzatlán', 'Guachinango', 'Guadalajara', 'Gómez Farías', 'Hostotipaquillo', 'Huejuquilla el Alto', 'Huejúcar', 'Ixtlahuacán de los Membrillos', 'Ixtlahuacán del Río', 'Jalostotitlán', 'Jamay', 'Jesús María', 'Jilotlán de los Dolores', 'Jocotepec', 'Juanacatlán', 'Juchitlán', 'La Barca', 'La Huerta', 'La Manzanilla de la Paz', 'Lagos de Moreno', 'Magdalena', 'Mascota', 'Mazamitla', 'Mexticacán', 'Mezquitic', 'Mixtlán', 'Ocotlán', 'Ojuelos de Jalisco', 'Pihuamo', 'Poncitlán', 'Puerto Vallarta', 'Quitupan', 'San Cristóbal de la Barranca', 'San Diego de Alejandría', 'San Gabriel', 'San Ignacio Cerro Gordo', 'San Juan de los Lagos', 'San Juanito de Escobedo', 'San Julián', 'San Marcos', 'San Martín Hidalgo', 'San Martín de Bolaños', 'San Miguel el Alto', 'San Pedro Tlaquepaque', 'San Sebastián del Oeste', 'Santa María de los Ángeles', 'Santa María del Oro', 'Sayula', 'Tala', 'Talpa de Allende', 'Tamazula de Gordiano', 'Tapalpa', 'Tecalitlán', 'Techaluta de Montenegro', 'Tecolotlán', 'Tenamaxtlán', 'Teocaltiche', 'Teocuitatlán de Corona', 'Tepatitlán de Morelos', 'Tequila', 'Teuchitlán', 'Tizapán el Alto', 'Tlajomulco de Zúñiga', 'Tolimán', 'Tomatlán', 'Tonalá', 'Tonaya', 'Tonila', 'Totatiche', 'Tototlán', 'Tuxcacuesco', 'Tuxcueca', 'Tuxpan', 'Unión de San Antonio', 'Unión de Tula', 'Valle de Guadalupe', 'Valle de Juárez', 'Villa Corona', 'Villa Guerrero', 'Villa Hidalgo', 'Villa Purificación', 'Yahualica de González Gallo', 'Zacoalco de Torres', 'Zapopan', 'Zapotiltic', 'Zapotitlán de Vadillo', 'Zapotlanejo', 'Zapotlán del Rey', 'Zapotlán el Grande'] },
  { name: 'Michoacán', abbr: 'MICH', municipalities: ['Acuitzio', 'Aguililla', 'Angamacutiro', 'Angangueo', 'Apatzingán', 'Aporo', 'Aquila', 'Ario', 'Arteaga', 'Briseñas', 'Buenavista', 'Carácuaro', 'Charapan', 'Charo', 'Chavinda', 'Cherán', 'Chilchota', 'Chinicuila', 'Chucándiro', 'Churintzio', 'Churumuco', 'Coahuayana', 'Coalcomán de Vázquez Pallares', 'Coeneo', 'Cojumatlán de Régules', 'Contepec', 'Copándaro', 'Cotija', 'Cuitzeo', 'Ecuandureo', 'Epitacio Huerta', 'Erongarícuaro', 'Gabriel Zamora', 'Hidalgo', 'Huandacareo', 'Huaniqueo', 'Huetamo', 'Huiramba', 'Indaparapeo', 'Irimbo', 'Ixtlán', 'Jacona', 'Jiménez', 'Jiquilpan', 'José Sixto Verduzco', 'Jungapeo', 'Juárez', 'La Huacana', 'La Piedad', 'Lagunillas', 'Los Reyes', 'Lázaro Cárdenas', 'Madero', 'Maravatío', 'Marcos Castellanos', 'Morelia', 'Morelos', 'Múgica', 'Nahuatzen', 'Nocupétaro', 'Nuevo Parangaricutiro', 'Nuevo Urecho', 'Numarán', 'Ocampo', 'Pajacuarán', 'Panindícuaro', 'Paracho', 'Parácuaro', 'Penjamillo', 'Peribán', 'Puruándiro', 'Purépero', 'Pátzcuaro', 'Queréndaro', 'Quiroga', 'Sahuayo', 'Salvador Escalante', 'San Lucas', 'Santa Ana Maya', 'Senguio', 'Susupuato', 'Tacámbaro', 'Tancítaro', 'Tangamandapio', 'Tangancícuaro', 'Tanhuato', 'Taretan', 'Tarímbaro', 'Tepalcatepec', 'Tingambato', 'Tingüindín', 'Tiquicheo de Nicolás Romero', 'Tlalpujahua', 'Tlazazalca', 'Tocumbo', 'Tumbiscatío', 'Turicato', 'Tuxpan', 'Tuzantla', 'Tzintzuntzan', 'Tzitzio', 'Uruapan', 'Venustiano Carranza', 'Villamar', 'Vista Hermosa', 'Yurécuaro', 'Zacapu', 'Zamora', 'Zinapécuaro', 'Zináparo', 'Ziracuaretiro', 'Zitácuaro', 'Álvaro Obregón'] },
  { name: 'Morelos', abbr: 'MOR', municipalities: ['Amacuzac', 'Atlatlahucan', 'Axochiapan', 'Ayala', 'Coatetelco', 'Coatlán del Río', 'Cuautla', 'Cuernavaca', 'Emiliano Zapata', 'Hueyapan', 'Huitzilac', 'Jantetelco', 'Jiutepec', 'Jojutla', 'Jonacatepec de Leandro Valle', 'Mazatepec', 'Miacatlán', 'Ocuituco', 'Puente de Ixtla', 'Temixco', 'Temoac', 'Tepalcingo', 'Tepoztlán', 'Tetecala', 'Tetela del Volcán', 'Tlalnepantla', 'Tlaltizapán de Zapata', 'Tlaquiltenango', 'Tlayacapan', 'Totolapan', 'Xochitepec', 'Xoxocotla', 'Yautepec', 'Yecapixtla', 'Zacatepec', 'Zacualpan de Amilpas'] },
  { name: 'Nayarit', abbr: 'NAY', municipalities: ['Acaponeta', 'Ahuacatlán', 'Amatlán de Cañas', 'Bahía de Banderas', 'Compostela', 'Del Nayar', 'Huajicori', 'Ixtlán del Río', 'Jala', 'La Yesca', 'Rosamorada', 'Ruíz', 'San Blas', 'San Pedro Lagunillas', 'Santa María del Oro', 'Santiago Ixcuintla', 'Tecuala', 'Tepic', 'Tuxpan', 'Xalisco'] },
  { name: 'Nuevo León', abbr: 'NL', municipalities: ['Abasolo', 'Agualeguas', 'Allende', 'Anáhuac', 'Apodaca', 'Aramberri', 'Bustamante', 'Cadereyta Jiménez', 'Cerralvo', 'China', 'Ciénega de Flores', 'Doctor Arroyo', 'Doctor Coss', 'Doctor González', 'El Carmen', 'Galeana', 'García', 'General Bravo', 'General Escobedo', 'General Terán', 'General Treviño', 'General Zaragoza', 'General Zuazua', 'Guadalupe', 'Hidalgo', 'Higueras', 'Hualahuises', 'Iturbide', 'Juárez', 'Lampazos de Naranjo', 'Linares', 'Los Aldamas', 'Los Herreras', 'Los Ramones', 'Marín', 'Melchor Ocampo', 'Mier y Noriega', 'Mina', 'Montemorelos', 'Monterrey', 'Parás', 'Pesquería', 'Rayones', 'Sabinas Hidalgo', 'Salinas Victoria', 'San Nicolás de los Garza', 'San Pedro Garza García', 'Santa Catarina', 'Santiago', 'Vallecillo', 'Villaldama'] },
  { name: 'Oaxaca', abbr: 'OAX', municipalities: ['Abejones', 'Acatlán de Pérez Figueroa', 'Asunción Cacalotepec', 'Asunción Cuyotepeji', 'Asunción Ixtaltepec', 'Asunción Nochixtlán', 'Asunción Ocotlán', 'Asunción Tlacolulita', 'Ayoquezco de Aldama', 'Ayotzintepec', 'Calihualá', 'Candelaria Loxicha', 'Capulálpam de Méndez', 'Chahuites', 'Chalcatongo de Hidalgo', 'Chiquihuitlán de Benito Juárez', 'Ciudad Ixtepec', 'Ciénega de Zimatlán', 'Coatecas Altas', 'Coicoyán de las Flores', 'Concepción Buenavista', 'Concepción Pápalo', 'Constancia del Rosario', 'Cosolapa', 'Cosoltepec', 'Cuilápam de Guerrero', 'Cuyamecalco Villa de Zaragoza', 'El Barrio de la Soledad', 'El Espinal', 'Eloxochitlán de Flores Magón', 'Fresnillo de Trujano', 'Guadalupe Etla', 'Guadalupe de Ramírez', 'Guelatao de Juárez', 'Guevea de Humboldt', 'Heroica Ciudad de Ejutla de Crespo', 'Heroica Ciudad de Huajuapan de León', 'Heroica Ciudad de Juchitán de Zaragoza', 'Heroica Ciudad de Miahuatlán de Porfirio Díaz', 'Heroica Ciudad de Tlaxiaco', 'Heroica Villa Tezoatlán de Segura y Luna, Cuna de la Independencia de Oaxaca', 'Heroica Villa de San Blas Atempa', 'Heroico San Martín de los Cansecos', 'Huautepec', 'Huautla de Jiménez', 'Ixpantepec Nieves', 'Ixtlán de Juárez', 'La Compañía', 'La Pe', 'La Reforma', 'La Trinidad Vista Hermosa', 'Loma Bonita', 'Magdalena Apasco', 'Magdalena Jaltepec', 'Magdalena Mixtepec', 'Magdalena Ocotlán', 'Magdalena Peñasco', 'Magdalena Teitipac', 'Magdalena Tequisistlán', 'Magdalena Tlacotepec', 'Magdalena Yodocono de Porfirio Díaz', 'Magdalena Zahuatlán', 'Mariscala de Juárez', 'Matías Romero Avendaño', 'Mazatlán Villa de Flores', 'Mesones Hidalgo', 'Mixistlán de la Reforma', 'Monjas', 'Mártires de Tacubaya', 'Natividad', 'Nazareno Etla', 'Nejapa de Madero', 'Nuevo Zoquiápam', 'Oaxaca de Juárez', 'Ocotlán de Morelos', 'Pinotepa de Don Luis', 'Pluma Hidalgo', 'Putla Villa de Guerrero', 'Reforma de Pineda', 'Reyes Etla', 'Rojas de Cuauhtémoc', 'Salina Cruz', 'San Agustín Amatengo', 'San Agustín Atenango', 'San Agustín Chayuco', 'San Agustín Etla', 'San Agustín Loxicha', 'San Agustín Tlacotepec', 'San Agustín Yatareni', 'San Agustín de las Juntas', 'San Andrés Cabecera Nueva', 'San Andrés Dinicuiti', 'San Andrés Huaxpaltepec', 'San Andrés Huayápam', 'San Andrés Ixtlahuaca', 'San Andrés Lagunas', 'San Andrés Nuxiño', 'San Andrés Paxtlán', 'San Andrés Sinaxtla', 'San Andrés Solaga', 'San Andrés Teotilálpam', 'San Andrés Tepetlapa', 'San Andrés Yaá', 'San Andrés Zabache', 'San Andrés Zautla', 'San Antonino Castillo Velasco', 'San Antonino Monte Verde', 'San Antonino el Alto', 'San Antonio Acutla', 'San Antonio Huitepec', 'San Antonio Nanahuatípam', 'San Antonio Sinicahua', 'San Antonio Tepetlapa', 'San Antonio de la Cal', 'San Baltazar Chichicápam', 'San Baltazar Loxicha', 'San Baltazar Yatzachi el Bajo', 'San Bartolo Coyotepec', 'San Bartolo Soyaltepec', 'San Bartolo Yautepec', 'San Bartolomé Ayautla', 'San Bartolomé Loxicha', 'San Bartolomé Quialana', 'San Bartolomé Yucuañe', 'San Bartolomé Zoogocho', 'San Bernardo Mixtepec', 'San Carlos Yautepec', 'San Cristóbal Amatlán', 'San Cristóbal Amoltepec', 'San Cristóbal Lachirioag', 'San Cristóbal Suchixtlahuaca', 'San Dionisio Ocotepec', 'San Dionisio Ocotlán', 'San Dionisio del Mar', 'San Esteban Atatlahuca', 'San Felipe Jalapa de Díaz', 'San Felipe Tejalápam', 'San Felipe Usila', 'San Francisco Cahuacuá', 'San Francisco Cajonos', 'San Francisco Chapulapa', 'San Francisco Chindúa', 'San Francisco Huehuetlán', 'San Francisco Ixhuatán', 'San Francisco Jaltepetongo', 'San Francisco Lachigoló', 'San Francisco Logueche', 'San Francisco Nuxaño', 'San Francisco Ozolotepec', 'San Francisco Sola', 'San Francisco Telixtlahuaca', 'San Francisco Teopan', 'San Francisco Tlapancingo', 'San Francisco del Mar', 'San Gabriel Mixtepec', 'San Ildefonso Amatlán', 'San Ildefonso Sola', 'San Ildefonso Villa Alta', 'San Jacinto Amilpas', 'San Jacinto Tlacotepec', 'San Jerónimo Coatlán', 'San Jerónimo Silacayoapilla', 'San Jerónimo Sosola', 'San Jerónimo Taviche', 'San Jerónimo Tecóatl', 'San Jerónimo Tlacochahuaya', 'San Jorge Nuchita', 'San José Ayuquila', 'San José Chiltepec', 'San José Estancia Grande', 'San José Independencia', 'San José Lachiguiri', 'San José Tenango', 'San José del Peñasco', 'San José del Progreso', 'San Juan Achiutla', 'San Juan Atepec', 'San Juan Bautista Atatlahuca', 'San Juan Bautista Coixtlahuaca', 'San Juan Bautista Cuicatlán', 'San Juan Bautista Guelache', 'San Juan Bautista Jayacatlán', 'San Juan Bautista Lo de Soto', 'San Juan Bautista Suchitepec', 'San Juan Bautista Tlachichilco', 'San Juan Bautista Tlacoatzintepec', 'San Juan Bautista Tuxtepec', 'San Juan Bautista Valle Nacional', 'San Juan Cacahuatepec', 'San Juan Chicomezúchil', 'San Juan Chilateca', 'San Juan Cieneguilla', 'San Juan Coatzóspam', 'San Juan Colorado', 'San Juan Comaltepec', 'San Juan Cotzocón', 'San Juan Diuxi', 'San Juan Evangelista Analco', 'San Juan Guelavía', 'San Juan Guichicovi', 'San Juan Ihualtepec', 'San Juan Juquila Mixes', 'San Juan Juquila Vijanos', 'San Juan Lachao', 'San Juan Lachigalla', 'San Juan Lajarcia', 'San Juan Lalana', 'San Juan Mazatlán', 'San Juan Mixtepec -Distrito 08-', 'San Juan Mixtepec -Distrito 26-', 'San Juan Ozolotepec', 'San Juan Petlapa', 'San Juan Quiahije', 'San Juan Quiotepec', 'San Juan Sayultepec', 'San Juan Tabaá', 'San Juan Tamazola', 'San Juan Teita', 'San Juan Teitipac', 'San Juan Tepeuxila', 'San Juan Teposcolula', 'San Juan Yaeé', 'San Juan Yatzona', 'San Juan Yucuita', 'San Juan de los Cués', 'San Juan del Estado', 'San Juan del Río', 'San Juan Ñumí', 'San Lorenzo', 'San Lorenzo Albarradas', 'San Lorenzo Cacaotepec', 'San Lorenzo Cuaunecuiltitla', 'San Lorenzo Texmelúcan', 'San Lorenzo Victoria', 'San Lucas Camotlán', 'San Lucas Ojitlán', 'San Lucas Quiaviní', 'San Lucas Zoquiápam', 'San Luis Amatlán', 'San Marcial Ozolotepec', 'San Marcos Arteaga', 'San Martín Huamelúlpam', 'San Martín Itunyoso', 'San Martín Lachilá', 'San Martín Peras', 'San Martín Tilcajete', 'San Martín Toxpalan', 'San Martín Zacatepec', 'San Mateo Cajonos', 'San Mateo Etlatongo', 'San Mateo Nejápam', 'San Mateo Peñasco', 'San Mateo Piñas', 'San Mateo Río Hondo', 'San Mateo Sindihui', 'San Mateo Tlapiltepec', 'San Mateo Yoloxochitlán', 'San Mateo Yucutindoo', 'San Mateo del Mar', 'San Melchor Betaza', 'San Miguel Achiutla', 'San Miguel Ahuehuetitlán', 'San Miguel Aloápam', 'San Miguel Amatitlán', 'San Miguel Amatlán', 'San Miguel Chicahua', 'San Miguel Chimalapa', 'San Miguel Coatlán', 'San Miguel Ejutla', 'San Miguel Huautla', 'San Miguel Mixtepec', 'San Miguel Panixtlahuaca', 'San Miguel Peras', 'San Miguel Piedras', 'San Miguel Quetzaltepec', 'San Miguel Santa Flor', 'San Miguel Soyaltepec', 'San Miguel Suchixtepec', 'San Miguel Tecomatlán', 'San Miguel Tenango', 'San Miguel Tequixtepec', 'San Miguel Tilquiápam', 'San Miguel Tlacamama', 'San Miguel Tlacotepec', 'San Miguel Tulancingo', 'San Miguel Yotao', 'San Miguel del Puerto', 'San Miguel del Río', 'San Miguel el Grande', 'San Nicolás', 'San Nicolás Hidalgo', 'San Pablo Coatlán', 'San Pablo Cuatro Venados', 'San Pablo Etla', 'San Pablo Huitzo', 'San Pablo Huixtepec', 'San Pablo Macuiltianguis', 'San Pablo Tijaltepec', 'San Pablo Villa de Mitla', 'San Pablo Yaganiza', 'San Pedro Amuzgos', 'San Pedro Apóstol', 'San Pedro Atoyac', 'San Pedro Cajonos', 'San Pedro Comitancillo', 'San Pedro Coxcaltepec Cántaros', 'San Pedro Huamelula', 'San Pedro Huilotepec', 'San Pedro Ixcatlán', 'San Pedro Ixtlahuaca', 'San Pedro Jaltepetongo', 'San Pedro Jicayán', 'San Pedro Jocotipac', 'San Pedro Juchatengo', 'San Pedro Mixtepec -Distrito 22-', 'San Pedro Mixtepec -Distrito 26-', 'San Pedro Molinos', 'San Pedro Mártir', 'San Pedro Mártir Quiechapa', 'San Pedro Mártir Yucuxaco', 'San Pedro Nopala', 'San Pedro Ocopetatillo', 'San Pedro Ocotepec', 'San Pedro Pochutla', 'San Pedro Quiatoni', 'San Pedro Sochiápam', 'San Pedro Tapanatepec', 'San Pedro Taviche', 'San Pedro Teozacoalco', 'San Pedro Teutila', 'San Pedro Tidaá', 'San Pedro Topiltepec', 'San Pedro Totolápam', 'San Pedro Yaneri', 'San Pedro Yucunama', 'San Pedro Yólox', 'San Pedro el Alto', 'San Pedro y San Pablo Ayutla', 'San Pedro y San Pablo Teposcolula', 'San Pedro y San Pablo Tequixtepec', 'San Raymundo Jalpan', 'San Sebastián Abasolo', 'San Sebastián Coatlán', 'San Sebastián Ixcapa', 'San Sebastián Nicananduta', 'San Sebastián Río Hondo', 'San Sebastián Tecomaxtlahuaca', 'San Sebastián Teitipac', 'San Sebastián Tutla', 'San Simón Almolongas', 'San Simón Zahuatlán', 'San Vicente Coatlán', 'San Vicente Lachixío', 'San Vicente Nuñú', 'Santa Ana', 'Santa Ana Ateixtlahuaca', 'Santa Ana Cuauhtémoc', 'Santa Ana Tavela', 'Santa Ana Tlapacoyan', 'Santa Ana Yareni', 'Santa Ana Zegache', 'Santa Ana del Valle', 'Santa Catalina Quierí', 'Santa Catarina Cuixtla', 'Santa Catarina Ixtepeji', 'Santa Catarina Juquila', 'Santa Catarina Lachatao', 'Santa Catarina Loxicha', 'Santa Catarina Mechoacán', 'Santa Catarina Minas', 'Santa Catarina Quiané', 'Santa Catarina Quioquitani', 'Santa Catarina Tayata', 'Santa Catarina Ticuá', 'Santa Catarina Yosonotú', 'Santa Catarina Zapoquila', 'Santa Cruz Acatepec', 'Santa Cruz Amilpas', 'Santa Cruz Itundujia', 'Santa Cruz Mixtepec', 'Santa Cruz Nundaco', 'Santa Cruz Papalutla', 'Santa Cruz Tacache de Mina', 'Santa Cruz Tacahua', 'Santa Cruz Tayata', 'Santa Cruz Xitla', 'Santa Cruz Xoxocotlán', 'Santa Cruz Zenzontepec', 'Santa Cruz de Bravo', 'Santa Gertrudis', 'Santa Inés Yatzeche', 'Santa Inés de Zaragoza', 'Santa Inés del Monte', 'Santa Lucía Miahuatlán', 'Santa Lucía Monteverde', 'Santa Lucía Ocotlán', 'Santa Lucía del Camino', 'Santa Magdalena Jicotlán', 'Santa María Alotepec', 'Santa María Apazco', 'Santa María Atzompa', 'Santa María Camotlán', 'Santa María Chachoápam', 'Santa María Chilchotla', 'Santa María Chimalapa', 'Santa María Colotepec', 'Santa María Cortijo', 'Santa María Coyotepec', 'Santa María Ecatepec', 'Santa María Guelacé', 'Santa María Guienagati', 'Santa María Huatulco', 'Santa María Huazolotitlán', 'Santa María Ipalapa', 'Santa María Ixcatlán', 'Santa María Jacatepec', 'Santa María Jalapa del Marqués', 'Santa María Jaltianguis', 'Santa María Lachixío', 'Santa María Mixtequilla', 'Santa María Nativitas', 'Santa María Nduayaco', 'Santa María Ozolotepec', 'Santa María Petapa', 'Santa María Peñoles', 'Santa María Pápalo', 'Santa María Quiegolani', 'Santa María Sola', 'Santa María Tataltepec', 'Santa María Tecomavaca', 'Santa María Temaxcalapa', 'Santa María Temaxcaltepec', 'Santa María Teopoxco', 'Santa María Tepantlali', 'Santa María Texcatitlán', 'Santa María Tlahuitoltepec', 'Santa María Tlalixtac', 'Santa María Tonameca', 'Santa María Totolapilla', 'Santa María Xadani', 'Santa María Yalina', 'Santa María Yavesía', 'Santa María Yolotepec', 'Santa María Yosoyúa', 'Santa María Yucuhiti', 'Santa María Zacatepec', 'Santa María Zaniza', 'Santa María Zoquitlán', 'Santa María del Rosario', 'Santa María del Tule', 'Santa María la Asunción', 'Santiago Amoltepec', 'Santiago Apoala', 'Santiago Apóstol', 'Santiago Astata', 'Santiago Atitlán', 'Santiago Ayuquililla', 'Santiago Cacaloxtepec', 'Santiago Camotlán', 'Santiago Choápam', 'Santiago Comaltepec', 'Santiago Huajolotitlán', 'Santiago Huauclilla', 'Santiago Ihuitlán Plumas', 'Santiago Ixcuintepec', 'Santiago Ixtayutla', 'Santiago Jamiltepec', 'Santiago Jocotepec', 'Santiago Juxtlahuaca', 'Santiago Lachiguiri', 'Santiago Lalopa', 'Santiago Laollaga', 'Santiago Laxopa', 'Santiago Llano Grande', 'Santiago Matatlán', 'Santiago Miltepec', 'Santiago Minas', 'Santiago Nacaltepec', 'Santiago Nejapilla', 'Santiago Niltepec', 'Santiago Nundiche', 'Santiago Nuyoó', 'Santiago Pinotepa Nacional', 'Santiago Suchilquitongo', 'Santiago Tamazola', 'Santiago Tapextla', 'Santiago Tenango', 'Santiago Tepetlapa', 'Santiago Tetepec', 'Santiago Texcalcingo', 'Santiago Textitlán', 'Santiago Tilantongo', 'Santiago Tillo', 'Santiago Tlazoyaltepec', 'Santiago Xanica', 'Santiago Xiacuí', 'Santiago Yaitepec', 'Santiago Yaveo', 'Santiago Yolomécatl', 'Santiago Yosondúa', 'Santiago Yucuyachi', 'Santiago Zacatepec', 'Santiago Zoochila', 'Santiago del Río', 'Santo Domingo Albarradas', 'Santo Domingo Armenta', 'Santo Domingo Chihuitán', 'Santo Domingo Ingenio', 'Santo Domingo Ixcatlán', 'Santo Domingo Nuxaá', 'Santo Domingo Ozolotepec', 'Santo Domingo Petapa', 'Santo Domingo Roayaga', 'Santo Domingo Tehuantepec', 'Santo Domingo Teojomulco', 'Santo Domingo Tepuxtepec', 'Santo Domingo Tlatayápam', 'Santo Domingo Tomaltepec', 'Santo Domingo Tonaltepec', 'Santo Domingo Tonalá', 'Santo Domingo Xagacía', 'Santo Domingo Yanhuitlán', 'Santo Domingo Yodohino', 'Santo Domingo Zanatepec', 'Santo Domingo de Morelos', 'Santo Tomás Jalieza', 'Santo Tomás Mazaltepec', 'Santo Tomás Ocotepec', 'Santo Tomás Tamazulapan', 'Santos Reyes Nopala', 'Santos Reyes Pápalo', 'Santos Reyes Tepejillo', 'Santos Reyes Yucuná', 'Silacayoápam', 'Sitio de Xitlapehua', 'Soledad Etla', 'Tamazulápam del Espíritu Santo', 'Tanetze de Zaragoza', 'Taniche', 'Tataltepec de Valdés', 'Teococuilco de Marcos Pérez', 'Teotitlán de Flores Magón', 'Teotitlán del Valle', 'Teotongo', 'Tepelmeme Villa de Morelos', 'Tlacolula de Matamoros', 'Tlacotepec Plumas', 'Tlalixtac de Cabrera', 'Totontepec Villa de Morelos', 'Trinidad Zaachila', 'Unión Hidalgo', 'Valerio Trujano', 'Villa Díaz Ordaz', 'Villa Hidalgo Yalálag', 'Villa Sola de Vega', 'Villa Talea de Castro', 'Villa Tejúpam de la Unión', 'Villa de Chilapa de Díaz', 'Villa de Etla', 'Villa de Santiago Chazumba', 'Villa de Tamazulápam del Progreso', 'Villa de Tututepec', 'Villa de Zaachila', 'Yaxe', 'Yogana', 'Yutanduchi de Guerrero', 'Zapotitlán Lagunas', 'Zapotitlán Palmas', 'Zimatlán de Álvarez', 'Ánimas Trujano'] },
  { name: 'Puebla', abbr: 'PUE', municipalities: ['Acajete', 'Acateno', 'Acatlán', 'Acatzingo', 'Acteopan', 'Ahuacatlán', 'Ahuatlán', 'Ahuazotepec', 'Ahuehuetitla', 'Ajalpan', 'Albino Zertuche', 'Aljojuca', 'Altepexi', 'Amixtlán', 'Amozoc', 'Aquixtla', 'Atempan', 'Atexcal', 'Atlequizayan', 'Atlixco', 'Atoyatempan', 'Atzala', 'Atzitzihuacán', 'Atzitzintla', 'Axutla', 'Ayotoxco de Guerrero', 'Calpan', 'Caltepec', 'Camocuautla', 'Caxhuacan', 'Cañada Morelos', 'Chalchicomula de Sesma', 'Chapulco', 'Chiautla', 'Chiautzingo', 'Chichiquila', 'Chiconcuautla', 'Chietla', 'Chigmecatitlán', 'Chignahuapan', 'Chignautla', 'Chila', 'Chila de la Sal', 'Chilchotla', 'Chinantla', 'Coatepec', 'Coatzingo', 'Cohetzala', 'Cohuecan', 'Coronango', 'Coxcatlán', 'Coyomeapan', 'Coyotepec', 'Cuapiaxtla de Madero', 'Cuautempan', 'Cuautinchán', 'Cuautlancingo', 'Cuayuca de Andrade', 'Cuetzalan del Progreso', 'Cuyoaco', 'Domingo Arenas', 'Eloxochitlán', 'Epatlán', 'Esperanza', 'Francisco Z. Mena', 'General Felipe Ángeles', 'Guadalupe', 'Guadalupe Victoria', 'Hermenegildo Galeana', 'Honey', 'Huaquechula', 'Huatlatlauca', 'Huauchinango', 'Huehuetla', 'Huehuetlán el Chico', 'Huehuetlán el Grande', 'Huejotzingo', 'Hueyapan', 'Hueytamalco', 'Hueytlalpan', 'Huitzilan de Serdán', 'Huitziltepec', 'Ixcamilpa de Guerrero', 'Ixcaquixtla', 'Ixtacamaxtitlán', 'Ixtepec', 'Izúcar de Matamoros', 'Jalpan', 'Jolalpan', 'Jonotla', 'Jopala', 'Juan C. Bonilla', 'Juan Galindo', 'Juan N. Méndez', 'La Magdalena Tlatlauquitepec', 'Lafragua', 'Libres', 'Los Reyes de Juárez', 'Mazapiltepec de Juárez', 'Mixtla', 'Molcaxac', 'Naupan', 'Nauzontla', 'Nealtican', 'Nicolás Bravo', 'Nopalucan', 'Ocotepec', 'Ocoyucan', 'Olintla', 'Oriental', 'Pahuatlán', 'Palmar de Bravo', 'Pantepec', 'Petlalcingo', 'Piaxtla', 'Puebla', 'Quecholac', 'Quimixtlán', 'Rafael Lara Grajales', 'San Andrés Cholula', 'San Antonio Cañada', 'San Diego la Mesa Tochimiltzingo', 'San Felipe Teotlalcingo', 'San Felipe Tepatlán', 'San Gabriel Chilac', 'San Gregorio Atzompa', 'San Jerónimo Tecuanipan', 'San Jerónimo Xayacatlán', 'San José Chiapa', 'San José Miahuatlán', 'San Juan Atenco', 'San Juan Atzompa', 'San Martín Texmelucan', 'San Martín Totoltepec', 'San Matías Tlalancaleca', 'San Miguel Ixitlán', 'San Miguel Xoxtla', 'San Nicolás Buenos Aires', 'San Nicolás de los Ranchos', 'San Pablo Anicano', 'San Pedro Cholula', 'San Pedro Yeloixtlahuaca', 'San Salvador Huixcolotla', 'San Salvador el Seco', 'San Salvador el Verde', 'San Sebastián Tlacotepec', 'Santa Catarina Tlaltempan', 'Santa Inés Ahuatempan', 'Santa Isabel Cholula', 'Santiago Miahuatlán', 'Santo Tomás Hueyotlipan', 'Soltepec', 'Tecali de Herrera', 'Tecamachalco', 'Tecomatlán', 'Tehuacán', 'Tehuitzingo', 'Tenampulco', 'Teopantlán', 'Teotlalco', 'Tepanco de López', 'Tepango de Rodríguez', 'Tepatlaxco de Hidalgo', 'Tepeaca', 'Tepemaxalco', 'Tepeojuma', 'Tepetzintla', 'Tepexco', 'Tepexi de Rodríguez', 'Tepeyahualco', 'Tepeyahualco de Cuauhtémoc', 'Tetela de Ocampo', 'Teteles de Ávila Castillo', 'Teziutlán', 'Tianguismanalco', 'Tilapa', 'Tlachichuca', 'Tlacotepec de Benito Juárez', 'Tlacuilotepec', 'Tlahuapan', 'Tlaltenango', 'Tlanepantla', 'Tlaola', 'Tlapacoya', 'Tlapanalá', 'Tlatlauquitepec', 'Tlaxco', 'Tochimilco', 'Tochtepec', 'Totoltepec de Guerrero', 'Tulcingo', 'Tuzamapan de Galeana', 'Tzicatlacoyan', 'Venustiano Carranza', 'Vicente Guerrero', 'Xayacatlán de Bravo', 'Xicotepec', 'Xicotlán', 'Xiutetelco', 'Xochiapulco', 'Xochiltepec', 'Xochitlán Todos Santos', 'Xochitlán de Vicente Suárez', 'Yaonáhuac', 'Yehualtepec', 'Zacapala', 'Zacapoaxtla', 'Zacatlán', 'Zapotitlán', 'Zapotitlán de Méndez', 'Zaragoza', 'Zautla', 'Zihuateutla', 'Zinacatepec', 'Zongozotla', 'Zoquiapan', 'Zoquitlán'] },
  { name: 'Querétaro', abbr: 'QRO', municipalities: ['Amealco de Bonfil', 'Arroyo Seco', 'Cadereyta de Montes', 'Colón', 'Corregidora', 'El Marqués', 'Ezequiel Montes', 'Huimilpan', 'Jalpan de Serra', 'Landa de Matamoros', 'Pedro Escobedo', 'Peñamiller', 'Pinal de Amoles', 'Querétaro', 'San Joaquín', 'San Juan del Río', 'Tequisquiapan', 'Tolimán'] },
  { name: 'Quintana Roo', abbr: 'QR', municipalities: ['Bacalar', 'Benito Juárez', 'Cozumel', 'Felipe Carrillo Puerto', 'Isla Mujeres', 'José María Morelos', 'Lázaro Cárdenas', 'Othón P. Blanco', 'Playa del Carmen', 'Puerto Morelos', 'Tulum'] },
  { name: 'San Luis Potosí', abbr: 'SLP', municipalities: ['Ahualulco del Sonido 13', 'Alaquines', 'Aquismón', 'Armadillo de los Infante', 'Axtla de Terrazas', 'Catorce', 'Cedral', 'Cerritos', 'Cerro de San Pedro', 'Charcas', 'Ciudad Fernández', 'Ciudad Valles', 'Ciudad del Maíz', 'Coxcatlán', 'Cárdenas', 'Ebano', 'El Naranjo', 'Guadalcázar', 'Huehuetlán', 'Lagunillas', 'Matehuala', 'Matlapa', 'Mexquitic de Carmona', 'Moctezuma', 'Rayón', 'Rioverde', 'Salinas', 'San Antonio', 'San Ciro de Acosta', 'San Luis Potosí', 'San Martín Chalchicuautla', 'San Nicolás Tolentino', 'San Vicente Tancuayalab', 'Santa Catarina', 'Santa María del Río', 'Santo Domingo', 'Soledad de Graciano Sánchez', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Tierra Nueva', 'Vanegas', 'Venado', 'Villa Hidalgo', 'Villa Juárez', 'Villa de Arista', 'Villa de Arriaga', 'Villa de Guadalupe', 'Villa de Pozos', 'Villa de Ramos', 'Villa de Reyes', 'Villa de la Paz', 'Xilitla', 'Zaragoza'] },
  { name: 'Sinaloa', abbr: 'SIN', municipalities: ['Ahome', 'Angostura', 'Badiraguato', 'Choix', 'Concordia', 'Cosalá', 'Culiacán', 'El Fuerte', 'Eldorado', 'Elota', 'Escuinapa', 'Guasave', 'Juan José Ríos', 'Mazatlán', 'Mocorito', 'Navolato', 'Rosario', 'Salvador Alvarado', 'San Ignacio', 'Sinaloa'] },
  { name: 'Sonora', abbr: 'SON', municipalities: ['Aconchi', 'Agua Prieta', 'Altar', 'Arivechi', 'Arizpe', 'Atil', 'Bacadéhuachi', 'Bacanora', 'Bacerac', 'Bacoachi', 'Banámichi', 'Bavispe', 'Baviácora', 'Benito Juárez', 'Benjamín Hill', 'Bácum', 'Caborca', 'Cajeme', 'Cananea', 'Carbó', 'Cucurpe', 'Cumpas', 'Divisaderos', 'Empalme', 'Etchojoa', 'Fronteras', 'General Plutarco Elías Calles', 'Granados', 'Guaymas', 'Hermosillo', 'Huachinera', 'Huatabampo', 'Huásabas', 'Huépac', 'Imuris', 'La Colorada', 'Magdalena', 'Mazatán', 'Moctezuma', 'Naco', 'Nacozari de García', 'Navojoa', 'Nogales', 'Nácori Chico', 'Opodepe', 'Oquitoa', 'Pitiquito', 'Puerto Peñasco', 'Quiriego', 'Rayón', 'Rosario', 'Sahuaripa', 'San Felipe de Jesús', 'San Ignacio Río Muerto', 'San Javier', 'San Luis Río Colorado', 'San Miguel de Horcasitas', 'San Pedro de la Cueva', 'Santa Ana', 'Santa Cruz', 'Soyopa', 'Suaqui Grande', 'Sáric', 'Tepache', 'Trincheras', 'Tubutama', 'Ures', 'Villa Hidalgo', 'Villa Pesqueira', 'Yécora', 'Álamos', 'Ónavas'] },
  { name: 'Tabasco', abbr: 'TAB', municipalities: ['Balancán', 'Centla', 'Centro', 'Comalcalco', 'Cunduacán', 'Cárdenas', 'Emiliano Zapata', 'Huimanguillo', 'Jalapa', 'Jalpa de Méndez', 'Jonuta', 'Macuspana', 'Nacajuca', 'Paraíso', 'Tacotalpa', 'Teapa', 'Tenosique'] },
  { name: 'Tamaulipas', abbr: 'TAMPS', municipalities: ['Abasolo', 'Aldama', 'Altamira', 'Antiguo Morelos', 'Burgos', 'Bustamante', 'Camargo', 'Casas', 'Ciudad Madero', 'Cruillas', 'El Mante', 'González', 'Guerrero', 'Gustavo Díaz Ordaz', 'Gómez Farías', 'Güémez', 'Hidalgo', 'Jaumave', 'Jiménez', 'Llera', 'Mainero', 'Matamoros', 'Mier', 'Miguel Alemán', 'Miquihuana', 'Méndez', 'Nuevo Laredo', 'Nuevo Morelos', 'Ocampo', 'Padilla', 'Palmillas', 'Reynosa', 'Río Bravo', 'San Carlos', 'San Fernando', 'San Nicolás', 'Soto la Marina', 'Tampico', 'Tula', 'Valle Hermoso', 'Victoria', 'Villagrán', 'Xicoténcatl'] },
  { name: 'Tlaxcala', abbr: 'TLAX', municipalities: ['Acuamanala de Miguel Hidalgo', 'Amaxac de Guerrero', 'Apetatitlán de Antonio Carvajal', 'Apizaco', 'Atlangatepec', 'Atltzayanca', 'Benito Juárez', 'Calpulalpan', 'Chiautempan', 'Contla de Juan Cuamatzi', 'Cuapiaxtla', 'Cuaxomulco', 'El Carmen Tequexquitla', 'Emiliano Zapata', 'Españita', 'Huamantla', 'Hueyotlipan', 'Ixtacuixtla de Mariano Matamoros', 'Ixtenco', 'La Magdalena Tlaltelulco', 'Lázaro Cárdenas', 'Mazatecochco de José María Morelos', 'Muñoz de Domingo Arenas', 'Nanacamilpa de Mariano Arista', 'Natívitas', 'Panotla', 'Papalotla de Xicohténcatl', 'San Damián Texóloc', 'San Francisco Tetlanohcan', 'San Jerónimo Zacualpan', 'San José Teacalco', 'San Juan Huactzinco', 'San Lorenzo Axocomanitla', 'San Lucas Tecopilco', 'San Pablo del Monte', 'Sanctórum de Lázaro Cárdenas', 'Santa Ana Nopalucan', 'Santa Apolonia Teacalco', 'Santa Catarina Ayometla', 'Santa Cruz Quilehtla', 'Santa Cruz Tlaxcala', 'Santa Isabel Xiloxoxtla', 'Tenancingo', 'Teolocholco', 'Tepetitla de Lardizábal', 'Tepeyanco', 'Terrenate', 'Tetla de la Solidaridad', 'Tetlatlahuca', 'Tlaxcala', 'Tlaxco', 'Tocatlán', 'Totolac', 'Tzompantepec', 'Xaloztoc', 'Xaltocan', 'Xicohtzinco', 'Yauhquemehcan', 'Zacatelco', 'Ziltlaltépec de Trinidad Sánchez Santos'] },
  { name: 'Veracruz', abbr: 'VER', municipalities: ['Acajete', 'Acatlán', 'Acayucan', 'Actopan', 'Acula', 'Acultzingo', 'Agua Dulce', 'Alpatláhuac', 'Alto Lucero de Gutiérrez Barrios', 'Altotonga', 'Alvarado', 'Amatitlán', 'Amatlán de los Reyes', 'Angel R. Cabada', 'Apazapan', 'Aquila', 'Astacinga', 'Atlahuilco', 'Atoyac', 'Atzacan', 'Atzalan', 'Ayahualulco', 'Banderilla', 'Benito Juárez', 'Boca del Río', 'Calcahualco', 'Camarón de Tejeda', 'Camerino Z. Mendoza', 'Carlos A. Carrillo', 'Carrillo Puerto', 'Castillo de Teayo', 'Catemaco', 'Cazones de Herrera', 'Cerro Azul', 'Chacaltianguis', 'Chalma', 'Chiconamel', 'Chiconquiaco', 'Chicontepec', 'Chinameca', 'Chinampa de Gorostiza', 'Chocamán', 'Chontla', 'Chumatlán', 'Citlaltépetl', 'Coacoatzintla', 'Coahuitlán', 'Coatepec', 'Coatzacoalcos', 'Coatzintla', 'Coetzala', 'Colipa', 'Comapa', 'Cosamaloapan de Carpio', 'Cosautlán de Carvajal', 'Coscomatepec', 'Cosoleacaque', 'Cotaxtla', 'Coxquihui', 'Coyutla', 'Cuichapa', 'Cuitláhuac', 'Córdoba', 'El Higo', 'Emiliano Zapata', 'Espinal', 'Filomeno Mata', 'Fortín', 'Gutiérrez Zamora', 'Hidalgotitlán', 'Huatusco', 'Huayacocotla', 'Hueyapan de Ocampo', 'Huiloapan de Cuauhtémoc', 'Ignacio de la Llave', 'Ilamatlán', 'Isla', 'Ixcatepec', 'Ixhuacán de los Reyes', 'Ixhuatlancillo', 'Ixhuatlán de Madero', 'Ixhuatlán del Café', 'Ixhuatlán del Sureste', 'Ixmatlahuacan', 'Ixtaczoquitlán', 'Jalacingo', 'Jalcomulco', 'Jamapa', 'Jesús Carranza', 'Jilotepec', 'José Azueta', 'Juan Rodríguez Clara', 'Juchique de Ferrer', 'Jáltipan', 'La Antigua', 'La Perla', 'Landero y Coss', 'Las Choapas', 'Las Minas', 'Las Vigas de Ramírez', 'Lerdo de Tejada', 'Los Reyes', 'Magdalena', 'Maltrata', 'Manlio Fabio Altamirano', 'Mariano Escobedo', 'Martínez de la Torre', 'Mecatlán', 'Mecayapan', 'Medellín de Bravo', 'Miahuatlán', 'Minatitlán', 'Misantla', 'Mixtla de Altamirano', 'Moloacán', 'Nanchital de Lázaro Cárdenas del Río', 'Naolinco', 'Naranjal', 'Naranjos Amatlán', 'Nautla', 'Nogales', 'Oluta', 'Omealca', 'Orizaba', 'Otatitlán', 'Oteapan', 'Ozuluama de Mascareñas', 'Pajapan', 'Papantla', 'Paso de Ovejas', 'Paso del Macho', 'Perote', 'Platón Sánchez', 'Playa Vicente', 'Poza Rica de Hidalgo', 'Pueblo Viejo', 'Puente Nacional', 'Pánuco', 'Rafael Delgado', 'Rafael Lucio', 'Río Blanco', 'Saltabarranca', 'San Andrés Tenejapan', 'San Andrés Tuxtla', 'San Juan Evangelista', 'San Rafael', 'Santiago Sochiapan', 'Santiago Tuxtla', 'Sayula de Alemán', 'Sochiapa', 'Soconusco', 'Soledad Atzompa', 'Soledad de Doblado', 'Soteapan', 'Tamalín', 'Tamiahua', 'Tampico Alto', 'Tancoco', 'Tantima', 'Tantoyuca', 'Tatahuicapan de Juárez', 'Tatatila', 'Tecolutla', 'Tehuipango', 'Tempoal', 'Tenampa', 'Tenochtitlán', 'Teocelo', 'Tepatlaxco', 'Tepetlán', 'Tepetzintla', 'Tequila', 'Texcatepec', 'Texhuacán', 'Texistepec', 'Tezonapa', 'Tierra Blanca', 'Tihuatlán', 'Tlachichilco', 'Tlacojalpan', 'Tlacolulan', 'Tlacotalpan', 'Tlacotepec de Mejía', 'Tlalixcoyan', 'Tlalnelhuayocan', 'Tlaltetela', 'Tlapacoyan', 'Tlaquilpa', 'Tlilapan', 'Tomatlán', 'Tonayán', 'Totutla', 'Tres Valles', 'Tuxpan', 'Tuxtilla', 'Ursulo Galván', 'Uxpanapa', 'Vega de Alatorre', 'Veracruz', 'Villa Aldama', 'Xalapa', 'Xico', 'Xoxocotla', 'Yanga', 'Yecuatla', 'Zacualpan', 'Zaragoza', 'Zentla', 'Zongolica', 'Zontecomatlán de López y Fuentes', 'Zozocolco de Hidalgo', 'Álamo Temapache'] },
  { name: 'Yucatán', abbr: 'YUC', municipalities: ['Abalá', 'Acanceh', 'Akil', 'Baca', 'Bokobá', 'Buctzotz', 'Cacalchén', 'Calotmul', 'Cansahcab', 'Cantamayec', 'Celestún', 'Cenotillo', 'Chacsinkín', 'Chankom', 'Chapab', 'Chemax', 'Chichimilá', 'Chicxulub Pueblo', 'Chikindzonot', 'Chocholá', 'Chumayel', 'Conkal', 'Cuncunul', 'Cuzamá', 'Dzan', 'Dzemul', 'Dzidzantún', 'Dzilam González', 'Dzilam de Bravo', 'Dzitás', 'Dzoncauich', 'Espita', 'Halachó', 'Hocabá', 'Hoctún', 'Homún', 'Huhí', 'Hunucmá', 'Ixil', 'Izamal', 'Kanasín', 'Kantunil', 'Kaua', 'Kinchil', 'Kopomá', 'Mama', 'Maní', 'Maxcanú', 'Mayapán', 'Mocochá', 'Motul', 'Muna', 'Muxupip', 'Mérida', 'Opichén', 'Oxkutzcab', 'Panabá', 'Peto', 'Progreso', 'Quintana Roo', 'Río Lagartos', 'Sacalum', 'Samahil', 'San Felipe', 'Sanahcat', 'Santa Elena', 'Seyé', 'Sinanché', 'Sotuta', 'Sucilá', 'Sudzal', 'Suma', 'Tahdziú', 'Tahmek', 'Teabo', 'Tecoh', 'Tekal de Venegas', 'Tekantó', 'Tekax', 'Tekit', 'Tekom', 'Telchac Pueblo', 'Telchac Puerto', 'Temax', 'Temozón', 'Tepakán', 'Tetiz', 'Teya', 'Ticul', 'Timucuy', 'Tinum', 'Tixcacalcupul', 'Tixkokob', 'Tixméhuac', 'Tixpéhual', 'Tizimín', 'Tunkás', 'Tzucacab', 'Uayma', 'Ucú', 'Umán', 'Valladolid', 'Xocchel', 'Yaxcabá', 'Yaxkukul', 'Yobaín'] },
  { name: 'Zacatecas', abbr: 'ZAC', municipalities: ['Apozol', 'Apulco', 'Atolinga', 'Benito Juárez', 'Calera', 'Cañitas de Felipe Pescador', 'Chalchihuites', 'Concepción del Oro', 'Cuauhtémoc', 'El Plateado de Joaquín Amaro', 'El Salvador', 'Fresnillo', 'Genaro Codina', 'General Enrique Estrada', 'General Francisco R. Murguía', 'General Pánfilo Natera', 'Guadalupe', 'Huanusco', 'Jalpa', 'Jerez', 'Jiménez del Teul', 'Juan Aldama', 'Juchipila', 'Loreto', 'Luis Moya', 'Mazapil', 'Melchor Ocampo', 'Mezquital del Oro', 'Miguel Auza', 'Momax', 'Monte Escobedo', 'Morelos', 'Moyahua de Estrada', 'Nochistlán de Mejía', 'Noria de Ángeles', 'Ojocaliente', 'Pinos', 'Pánuco', 'Río Grande', 'Sain Alto', 'Santa María de la Paz', 'Sombrerete', 'Susticacán', 'Tabasco', 'Tepechitlán', 'Tepetongo', 'Teúl de González Ortega', 'Tlaltenango de Sánchez Román', 'Trancoso', 'Trinidad García de la Cadena', 'Valparaíso', 'Vetagrande', 'Villa García', 'Villa González Ortega', 'Villa Hidalgo', 'Villa de Cos', 'Villanueva', 'Zacatecas'] },
]

// Cities the platform currently supports (BCS municipalities)
export const CITIES = STATES_DATA.find(s => s.abbr === 'BCS')?.municipalities ?? ['Los Cabos', 'La Paz', 'Loreto', 'Comondú', 'Mulegé']

function normalizePlace(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/^(municipio|delegaci[oó]n|alcald[ií]a)\s+(de\s+)?/, '')
    .trim()
}

// Matches a free-text place name (e.g. from reverse geocoding, which often
// returns "Municipio de X" or a locality name instead of the bare official
// municipio name) against the official municipio catalog — exact match
// first, then substring as a fallback (e.g. "San José del Cabo" → no exact
// hit → still tries Los Cabos only if one name contains the other).
export function findMunicipio(candidate: string): { state: string; municipio: string } | null {
  const target = normalizePlace(candidate)
  if (!target) return null
  for (const s of STATES_DATA) {
    for (const m of s.municipalities) {
      if (normalizePlace(m) === target) return { state: s.name, municipio: m }
    }
  }
  for (const s of STATES_DATA) {
    for (const m of s.municipalities) {
      const nm = normalizePlace(m)
      if (target.includes(nm) || nm.includes(target)) return { state: s.name, municipio: m }
    }
  }
  return null
}

export type AlertType = 'happy_hour' | 'evento' | 'promo' | 'ultimos_lugares'

export interface ProactiveAlert {
  id: string
  bizId: string
  type: AlertType
  title: string       // shown in the card headline
  body: string        // supporting text
  cta: string         // button label
  startTime: string   // "HH:MM" — when alert becomes visible
  endTime: string     // "HH:MM" — when alert expires (can cross midnight)
  days: number[]      // 0=Dom … 6=Sáb; empty = every day
  active: boolean
}

export interface Business {
  id: string
  name: string
  cat: string
  type: string
  price: number
  rating: number
  localFav: boolean
  dist: number
  hood: string
  open: boolean
  hours: string
  featured: boolean
  grad: [string, string]
  mono: string
  en: string
  es: string
  tags: string[]
  reviews: Array<{ who: string; txt: string; es: boolean }>
  slots: string[]
  alerts?: ProactiveAlert[]
}

// A bookable service/product in a business catalog.
// Same shape the business edits in /biz (CatItem minus the runtime active/img flags),
// so both panels read one shared definition. `price` is a display string
// (e.g. '$2,400', 'Sin depósito', 'Cotización') matching how /biz stores it.
export interface Service {
  id: string
  name: string
  sub: string
  price: string
  category: string
  grad: [string, string]
  duration?: number // minutes — when set, booking slots are generated from the business hours spaced by this
  scheduled?: boolean // false = product/quote without a calendar (no date/time, just a request). Absent/true = bookable with date + time.
  days?: number[] // weekdays this service is offered (0=Sun..6=Sat). Absent = every day.
  hours?: string // per-service "HH:MM – HH:MM" override. Absent = use the business hours.
  includes?: string[] // what the service includes (shown in its detail view).
  stock?: number // units left when inventory is tracked. Absent = unlimited (no tracking). A number (incl. 0) = tracked; 0 = agotado (out of stock).
}

// Does this service track a limited inventory? A numeric `stock` (including 0)
// means yes; absent means unlimited availability.
export function tracksStock(s?: Service): boolean {
  return typeof s?.stock === 'number'
}

// Can this service still be sold / requested? Untracked services are always
// available; tracked ones only while they have units left.
export function inStock(s?: Service): boolean {
  return !tracksStock(s) || (s!.stock as number) > 0
}

// Is the service offered on this weekday (0=Sun..6=Sat)? No `days` = every day.
export function dayOffered(s: Service | undefined, dow: number): boolean {
  return !s?.days || s.days.length === 0 || s.days.includes(dow)
}

// Whether a service is booked with a calendar (date + time). Default true;
// only services explicitly flagged `scheduled: false` skip the calendar.
export function isScheduled(s?: Service): boolean {
  return !s || s.scheduled !== false
}

// Parse a posted business-hours string ("09:00 – 20:00", also handles a
// midnight-crossing range like "18:00 – 01:00") and return the start times at
// which a service of `durationMin` fits before closing. Times are snapped to a
// clean 30-min grid. Returns [] if the string isn't a parseable range
// (e.g. "Zarpa 17:30") so callers can fall back to curated slots.
export function slotsFromHours(hours: string, durationMin: number): string[] {
  const m = hours.match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/)
  if (!m) return []
  const start = +m[1] * 60 + +m[2]
  let end = +m[3] * 60 + +m[4]
  if (end <= start) end += 24 * 60 // crosses midnight
  const step = Math.max(30, Math.ceil(durationMin / 30) * 30)
  const out: string[] = []
  for (let t = start; t + durationMin <= end; t += step) {
    const hh = Math.floor((t % (24 * 60)) / 60)
    const mm = t % 60
    out.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }
  return out
}

// ── Agenda / availability ─────────────────────────────────
// Shared agenda: the bookings the business sees in /biz → Agenda are the SAME
// ones that block slots in the /app booking sheet. (Demo: every entry is
// "today" = day offset 0; future days show full availability until persisted.)
export interface Appt {
  time: string
  durationMin: number
  who: string
  party: number
  tag: string
  resource: string
  service?: string // which catalog service this appointment is for
  note?: string
}

// `endTime('14:00', 90)` → '15:30'.
export function endTime(time: string, durationMin: number): string {
  const t = toMin(time) + durationMin
  const hh = Math.floor((t % (24 * 60)) / 60)
  const mm = t % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export const AGENDA: Record<string, Appt[]> = {
  lupita: [
    { time: '13:30', durationMin: 90, who: 'Sofía M.', party: 2, tag: 'Confirmada', resource: 'Barra', service: 'Mesa estándar', note: 'Cumpleaños, algo tranquilo' },
    { time: '14:00', durationMin: 90, who: 'Beto L.', party: 3, tag: 'Sentados', resource: 'Terraza', service: 'Mesa terraza' },
    { time: '19:30', durationMin: 90, who: 'Jordan A.', party: 2, tag: 'Confirmada', resource: 'Terraza', service: 'Mesa terraza', note: 'Aniversario, mesa tranquila' },
    { time: '20:00', durationMin: 90, who: 'Karen H.', party: 5, tag: 'Confirmada', resource: 'Salón', service: 'Mesa estándar' },
    { time: '20:30', durationMin: 90, who: 'Reva · pendiente', party: 2, tag: 'Por confirmar', resource: 'Terraza', service: 'Mesa terraza' },
    { time: '21:00', durationMin: 90, who: 'Daniela R.', party: 4, tag: 'Confirmada', resource: 'Salón', service: 'Mesa estándar', note: 'Lo de siempre 🌮' },
  ],
  sereno: [
    { time: '11:30', durationMin: 80, who: 'Laura S.', party: 1, tag: 'En curso', resource: 'Ana', service: 'Masaje 80 min' },
    { time: '12:00', durationMin: 90, who: 'Carla M.', party: 1, tag: 'Confirmada', resource: 'Joel', service: 'Temazcal' },
    { time: '14:00', durationMin: 80, who: 'Pareja Ruiz', party: 2, tag: 'Confirmada', resource: 'Ana / Luis', service: 'Masaje en pareja' },
    { time: '16:00', durationMin: 80, who: 'Emily W.', party: 2, tag: 'Por confirmar', resource: 'Ana / Luis', service: 'Masaje en pareja' },
  ],
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// For each base slot, decide if it's already taken given the day's agenda.
// Timed services (with a duration) use interval overlap against each booking's
// span; capacity-based slots (no duration, e.g. restaurant tables) are taken
// only on an exact start-time match.
export function slotAvailability(
  bizId: string,
  dayOffset: number,
  slots: string[],
  serviceDuration?: number,
): { time: string; taken: boolean }[] {
  const bookings = dayOffset === 0 ? (AGENDA[bizId] ?? []) : []
  return slots.map(time => {
    let taken = false
    if (serviceDuration) {
      const s = toMin(time)
      const e = s + serviceDuration
      taken = bookings.some(b => {
        const bs = toMin(b.time)
        return s < bs + b.durationMin && bs < e
      })
    } else {
      taken = bookings.some(b => b.time === time)
    }
    return { time, taken }
  })
}

// Next `n` calendar days with correct weekday labels (first = Today/Hoy).
export function upcomingDays(n: number, en: boolean): { label: string; iso: string; dow: number }[] {
  const WD = en
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const out: { label: string; iso: string; dow: number }[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    out.push({
      label: i === 0 ? (en ? 'Today' : 'Hoy') : `${WD[d.getDay()]} ${d.getDate()}`,
      iso: d.toISOString().split('T')[0],
      dow: d.getDay(),
    })
  }
  return out
}

export const BIZ: Business[] = [
  {
    id: 'lupita', name: 'La Lupita Taco & Mezcal', cat: 'Comer', type: 'Mexicana · Tacos',
    price: 2, rating: 4.8, localFav: true, dist: 2.4, hood: 'San José del Cabo',
    open: true, hours: '13:00 – 23:00', featured: false,
    grad: ['#E27A52', '#B5472F'], mono: 'L',
    en: 'Where locals actually eat tacos — wood-fire, 60 mezcals, live music Thursdays.',
    es: 'Donde los locales sí comen tacos — al carbón, 60 mezcales, música en vivo los jueves.',
    tags: ['Tacos al pastor', 'Mezcal flight', 'Live music'],
    reviews: [
      { who: 'Mariana, vecina', txt: 'El pastor y el mezcal de la casa, sin falla.', es: true },
      { who: "Local since '09", txt: 'Skip the marina spots, come here.', es: false },
    ],
    slots: ['19:00', '19:30', '20:00', '20:30', '21:00'],
  },
  {
    id: 'huerta', name: 'Huerta del Mar', cat: 'Comer', type: 'Farm-to-table · $$$',
    price: 3, rating: 4.9, localFav: true, dist: 11.2, hood: 'Ánimas Bajas',
    open: true, hours: '18:00 – 22:30', featured: true,
    grad: ['#7FA36B', '#3F6B49'], mono: 'H',
    en: 'Candle-lit garden dinner, everything grown on the farm. A Cabo rite of passage.',
    es: 'Cena en el huerto a la luz de velas, todo de la granja. Un must en Cabo.',
    tags: ['Tasting menu', 'Garden seating', 'Natural wine'],
    reviews: [
      { who: 'Daniela, vecina', txt: 'Pide la mesa del huerto al atardecer.', es: true },
      { who: 'Ricardo P.', txt: 'Worth the drive, book ahead.', es: false },
    ],
    slots: ['18:30', '19:00', '19:30', '20:00'],
  },
  {
    id: 'sereno', name: 'Sereno Spa & Temazcal', cat: 'Spa', type: 'Bienestar · Masaje',
    price: 3, rating: 4.9, localFav: false, dist: 5.1, hood: 'Corredor Turístico',
    open: true, hours: '09:00 – 20:00', featured: false,
    grad: ['#C9A2B4', '#6E4A63'], mono: 'S',
    en: 'Ocean-view massage and traditional temazcal ceremony. Pure reset.',
    es: 'Masaje con vista al mar y ceremonia de temazcal tradicional. Reset total.',
    tags: ['80-min massage', 'Temazcal', 'Couples'],
    reviews: [
      { who: 'Ana, vecina', txt: 'El temazcal con luna llena es otra cosa.', es: true },
      { who: 'Jess M.', txt: 'Best massage of the whole trip.', es: false },
    ],
    slots: ['10:00', '12:00', '14:00', '16:00'],
  },
  {
    id: 'azul', name: 'Cabo Azul Sunset Sail', cat: 'Tours', type: 'Catamarán · 2.5 h',
    price: 2, rating: 4.7, localFav: false, dist: 3.8, hood: 'Marina Cabo San Lucas',
    open: true, hours: 'Zarpa 17:30', featured: true,
    grad: ['#E9A24A', '#C25C3C'], mono: 'A',
    en: 'Small-group catamaran past El Arco at golden hour. Open bar, no crowds.',
    es: 'Catamarán de grupo chico pasando El Arco al atardecer. Barra libre, sin multitudes.',
    tags: ['Sunset', 'Open bar', 'El Arco'],
    reviews: [
      { who: 'Tom & Lia', txt: 'The arch at sunset — unreal.', es: false },
      { who: 'Sofía, vecina', txt: 'Grupo chico, nada turistero.', es: true },
    ],
    slots: ['17:30'],
  },
  {
    id: 'comal', name: 'Comal Costero', cat: 'Comer', type: 'Mariscos · Playa',
    price: 2, rating: 4.6, localFav: true, dist: 1.2, hood: 'Playa El Médano',
    open: true, hours: '12:00 – 21:00', featured: false,
    grad: ['#5FA6B0', '#2E6E78'], mono: 'C',
    en: 'Feet-in-the-sand ceviche and aguachile, caught that morning.',
    es: 'Ceviche y aguachile con los pies en la arena, pescado del día.',
    tags: ['Aguachile', 'Beachfront', 'Michelada'],
    reviews: [
      { who: 'Beto, vecino', txt: 'El aguachile de camarón, siempre.', es: true },
      { who: 'Karen H.', txt: 'Lunch with toes in the sand. Yes.', es: false },
    ],
    slots: ['13:00', '14:00', '15:00', '16:00'],
  },
  {
    id: 'mirador', name: 'Mirador Mezcalería', cat: 'Vida nocturna', type: 'Bar · Rooftop',
    price: 2, rating: 4.7, localFav: true, dist: 2.0, hood: 'Centro, San José',
    open: true, hours: '18:00 – 01:00', featured: false,
    grad: ['#8B6CB0', '#4A3370'], mono: 'M',
    en: 'Rooftop mezcal bar, low light, vinyl. Where the night actually starts.',
    es: 'Mezcalería de azotea, luz tenue, vinilo. Donde sí empieza la noche.',
    tags: ['Rooftop', 'Mezcal', 'Vinyl'],
    reviews: [
      { who: 'Pau, vecina', txt: 'Happy hour 6–8, terraza increíble.', es: true },
      { who: 'Marcus', txt: 'Found my new favorite bar.', es: false },
    ],
    slots: ['18:00', '19:00', '20:00', '21:00'],
    alerts: [
      {
        id: 'mirador-hh-1',
        bizId: 'mirador',
        type: 'happy_hour',
        title: 'Es happy hour a 2 min de ti — Mirador Mezcalería',
        body: 'Terraza de azotea, 6–8pm. ¿Te aparto antes de que se llene?',
        cta: 'Échale un ojo',
        startTime: '00:00',
        endTime: '23:59',
        days: [],
        active: true,
      },
    ],
  },
  {
    id: 'aqua', name: 'Aqua Wellness', cat: 'Spa', type: 'Bienestar · Masaje', price: 3, rating: 4.7, localFav: false, dist: 6.2, hood: 'Corredor Turístico',
    open: true, hours: '10:00 – 21:00', featured: false,
    grad: ['#5FA6B0', '#2E6E78'], mono: 'A',
    en: 'Hydrotherapy circuit and deep-tissue massage. Calm, clinical, very good.',
    es: 'Circuito de hidroterapia y masaje de tejido profundo. Tranquilo y muy bueno.',
    tags: ['Masaje', 'Hidroterapia', 'Facial'],
    reviews: [
      { who: 'Renata, vecina', txt: 'El masaje deportivo me dejó nueva.', es: true },
      { who: 'Greg P.', txt: 'The hydro circuit alone is worth it.', es: false },
    ],
    slots: ['10:00', '12:00', '14:00', '16:00', '18:00'],
  },
  {
    id: 'jade', name: 'Jade Spa Cabo', cat: 'Spa', type: 'Bienestar · Masaje', price: 2, rating: 4.6, localFav: true, dist: 4.0, hood: 'Cabo San Lucas',
    open: true, hours: '09:00 – 19:00', featured: false,
    grad: ['#7FA36B', '#3F6B49'], mono: 'J',
    en: 'No-frills neighborhood spa locals swear by. Great value massages.',
    es: 'Spa de barrio sin pretensiones, de los que recomiendan los locales. Masajes a buen precio.',
    tags: ['Masaje', 'Reflexología', 'Pareja'],
    reviews: [
      { who: 'Lalo, vecino', txt: 'Calidad-precio inmejorable, voy cada mes.', es: true },
      { who: 'Amy R.', txt: 'Hidden gem, way better than the resort spa.', es: false },
    ],
    slots: ['09:00', '11:00', '13:00', '15:00', '17:00'],
  },
  {
    id: 'origen', name: 'Origen Holístico', cat: 'Spa', type: 'Bienestar · Holístico', price: 3, rating: 4.8, localFav: false, dist: 8.5, hood: 'San José del Cabo',
    open: true, hours: '08:00 – 20:00', featured: false,
    grad: ['#C9A2B4', '#6E4A63'], mono: 'O',
    en: 'Mayan-inspired rituals, sound baths and massage in a desert garden.',
    es: 'Rituales de inspiración maya, baños de sonido y masaje en un jardín del desierto.',
    tags: ['Masaje', 'Ritual', 'Sound bath'],
    reviews: [
      { who: 'Diana, vecina', txt: 'El baño de sonido es otro nivel.', es: true },
      { who: 'Owen T.', txt: 'Most unique spa day I have had anywhere.', es: false },
    ],
    slots: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
  },
]

// ── Shared catalog ────────────────────────────────────────
// Single source of truth for what each business offers. Imported by BOTH the
// business panel (/biz seeds its editable CatalogView from here) and the
// consumer app (/app BizDetail renders these as selectable services).
// Sereno & La Lupita mirror the real items the business manages in /biz.
// NOTE: until catalog is persisted (Supabase), edits a business makes in /biz
// won't sync here live — this is the shared seed definition.
export const CATALOG: Record<string, Service[]> = {
  lupita: [
    { id: 'lupita-mesa-std', name: 'Mesa estándar', sub: '2–4 personas · Salón', price: 'Sin depósito', category: 'Mesas', grad: ['#E27A52', '#B5472F'] },
    { id: 'lupita-mesa-terraza', name: 'Mesa terraza', sub: '2–6 personas · Vista', price: '$200 depósito', category: 'Mesas', grad: ['#E9A24A', '#C25C3C'] },
    { id: 'lupita-mezcal', name: 'Mezcal flight', sub: 'Cata · 5 mezcales', price: '$450', category: 'Bebidas', grad: ['#8B6CB0', '#4A3370'], scheduled: false, stock: 8 },
    { id: 'lupita-pastor', name: 'Orden de tacos al pastor', sub: 'Al carbón · 4 tacos', price: '$180', category: 'Platillos', grad: ['#E27A52', '#B5472F'], scheduled: false },
    { id: 'lupita-aguachile', name: 'Aguachile', sub: 'Camarón · al gusto', price: '$220', category: 'Platillos', grad: ['#5FA6B0', '#2E6E78'], scheduled: false },
    { id: 'lupita-treslechess', name: 'Tres leches', sub: 'Postre de la casa', price: '$120', category: 'Postres', grad: ['#C9A2B4', '#6E4A63'], scheduled: false },
    { id: 'lupita-evento', name: 'Evento privado', sub: 'Hasta 20 · Salón completo', price: 'Cotización', category: 'Eventos', grad: ['#5FA6B0', '#2E6E78'], scheduled: false, stock: 3 },
  ],
  sereno: [
    { id: 'sereno-masaje80', name: 'Masaje 80 min', sub: 'Vista al mar', price: '$2,400', category: 'Masajes', grad: ['#C9A2B4', '#6E4A63'], duration: 80, includes: ['80 min de masaje a elegir (relajante o profundo)', 'Cabaña con vista al mar', 'Aromaterapia y aceites naturales', 'Acceso a regaderas y té de cortesía'] },
    { id: 'sereno-temazcal', name: 'Temazcal', sub: 'Ceremonia · 90 min', price: '$1,800', category: 'Rituales', grad: ['#E27A52', '#B5472F'], duration: 90, days: [3, 4, 5, 6], includes: ['Ceremonia de temazcal de 90 min', 'Guía temazcalero tradicional', 'Hierbas medicinales y copal', 'Agua de frutas e infusión al cierre'] },
    { id: 'sereno-pareja', name: 'Masaje en pareja', sub: 'Cabaña doble', price: '$4,600', category: 'Masajes', grad: ['#5FA6B0', '#2E6E78'], duration: 80, includes: ['80 min de masaje para 2 personas', 'Cabaña doble privada con vista', '2 terapeutas simultáneos', 'Copa de vino o agua infusionada'] },
    { id: 'sereno-ritual', name: 'Ritual día completo', sub: '4 servicios', price: '$7,900', category: 'Rituales', grad: ['#E9A24A', '#C25C3C'], duration: 240, stock: 2, includes: ['Masaje 80 min', 'Ceremonia de temazcal', 'Facial y exfoliación corporal', 'Comida saludable y acceso al spa todo el día'] },
  ],
  huerta: [
    { id: 'huerta-degustacion', name: 'Menú degustación', sub: '7 tiempos · de la granja', price: '$1,950', category: 'Menús', grad: ['#7FA36B', '#3F6B49'], duration: 120 },
    { id: 'huerta-mesa-huerto', name: 'Mesa en el huerto', sub: 'Al atardecer · 2–4', price: '$200 depósito', category: 'Mesas', grad: ['#E9A24A', '#C25C3C'] },
    { id: 'huerta-maridaje', name: 'Maridaje vino natural', sub: '5 copas', price: '$850', category: 'Bebidas', grad: ['#8B6CB0', '#4A3370'], scheduled: false },
    { id: 'huerta-privada', name: 'Cena privada', sub: 'Hasta 10 personas', price: 'Cotización', category: 'Eventos', grad: ['#5FA6B0', '#2E6E78'], scheduled: false },
  ],
  azul: [
    { id: 'azul-velero', name: 'Velero al atardecer', sub: 'Grupo chico · 2.5 h', price: '$1,650', category: 'Tours', grad: ['#E9A24A', '#C25C3C'] },
    { id: 'azul-premium', name: 'Asiento premium', sub: 'Zona delantera + barra', price: '$2,200', category: 'Tours', grad: ['#E27A52', '#B5472F'] },
    { id: 'azul-charter', name: 'Charter privado', sub: 'Hasta 12 · barco completo', price: 'Cotización', category: 'Eventos', grad: ['#5FA6B0', '#2E6E78'], scheduled: false },
  ],
  comal: [
    { id: 'comal-aguachile', name: 'Aguachile de camarón', sub: 'Del día', price: '$280', category: 'Platillos', grad: ['#5FA6B0', '#2E6E78'], scheduled: false },
    { id: 'comal-ceviche', name: 'Ceviche del día', sub: 'Pescado fresco', price: '$240', category: 'Platillos', grad: ['#7FA36B', '#3F6B49'], scheduled: false },
    { id: 'comal-mesa-playa', name: 'Mesa en la playa', sub: 'Pies en la arena', price: 'Sin depósito', category: 'Mesas', grad: ['#E9A24A', '#C25C3C'] },
    { id: 'comal-michelada', name: 'Michelada', sub: 'Clásica o clamato', price: '$120', category: 'Bebidas', grad: ['#8B6CB0', '#4A3370'], scheduled: false },
  ],
  mirador: [
    { id: 'mirador-mesa-terraza', name: 'Mesa terraza', sub: 'Azotea · vista', price: 'Sin depósito', category: 'Mesas', grad: ['#8B6CB0', '#4A3370'] },
    { id: 'mirador-flight', name: 'Flight de mezcal', sub: 'Cata · 5 mezcales', price: '$420', category: 'Bebidas', grad: ['#E27A52', '#B5472F'], scheduled: false },
    { id: 'mirador-reservado', name: 'Reservado para grupo', sub: '6–12 personas', price: '$300 depósito', category: 'Eventos', grad: ['#5FA6B0', '#2E6E78'] },
    { id: 'mirador-botella', name: 'Servicio de botella', sub: 'Mezcal o destilado', price: 'Cotización', category: 'Bebidas', grad: ['#E9A24A', '#C25C3C'], scheduled: false },
  ],
  aqua: [
    { id: 'aqua-deep', name: 'Masaje de tejido profundo', sub: '60 min', price: '$1,900', category: 'Masajes', grad: ['#5FA6B0', '#2E6E78'], duration: 60, includes: ['60 min de masaje de presión profunda', 'Enfoque en zonas de tensión', 'Aceite tibio de arnica', 'Acceso al circuito de hidroterapia'] },
    { id: 'aqua-relax', name: 'Masaje relajante', sub: '90 min', price: '$2,300', category: 'Masajes', grad: ['#7FA36B', '#3F6B49'], duration: 90, includes: ['90 min de masaje sueco suave', 'Aromaterapia a elegir', 'Compresas calientes', 'Té relajante de cortesía'] },
    { id: 'aqua-hidro', name: 'Circuito de hidroterapia', sub: '120 min', price: '$1,200', category: 'Bienestar', grad: ['#8B6CB0', '#4A3370'], duration: 120, includes: ['Sauna, vapor y jacuzzi', 'Regaderas de contraste', 'Zona de descanso', 'Toalla, sandalias y agua'] },
  ],
  jade: [
    { id: 'jade-masaje', name: 'Masaje sueco', sub: '60 min', price: '$1,100', category: 'Masajes', grad: ['#7FA36B', '#3F6B49'], duration: 60, includes: ['60 min de masaje sueco', 'Presión a tu gusto', 'Aceite de almendras', 'Té de hierbas al terminar'] },
    { id: 'jade-pareja', name: 'Masaje en pareja', sub: '60 min · 2 personas', price: '$2,000', category: 'Masajes', grad: ['#C9A2B4', '#6E4A63'], duration: 60, includes: ['60 min de masaje para 2', 'Sala compartida', '2 terapeutas', 'Aromaterapia incluida'] },
    { id: 'jade-reflexo', name: 'Reflexología', sub: '45 min', price: '$800', category: 'Masajes', grad: ['#E9A24A', '#C25C3C'], duration: 45, includes: ['45 min de reflexología podal', 'Mapa de puntos de presión', 'Baño de pies con sales', 'Crema hidratante'] },
  ],
  origen: [
    { id: 'origen-masaje', name: 'Masaje holístico', sub: '80 min', price: '$2,200', category: 'Masajes', grad: ['#C9A2B4', '#6E4A63'], duration: 80, includes: ['80 min de masaje holístico', 'Lectura energética inicial', 'Aceites esenciales orgánicos', 'Cierre con cuencos tibetanos'] },
    { id: 'origen-ritual', name: 'Ritual maya', sub: '120 min', price: '$3,400', category: 'Rituales', grad: ['#E27A52', '#B5472F'], duration: 120, includes: ['Ritual de limpia maya', 'Exfoliación con cacao y miel', 'Masaje de 60 min', 'Ceremonia de cierre con copal'] },
    { id: 'origen-sound', name: 'Baño de sonido', sub: '60 min', price: '$950', category: 'Bienestar', grad: ['#8B6CB0', '#4A3370'], duration: 60, includes: ['60 min de baño de sonido', 'Cuencos de cuarzo y gongs', 'Meditación guiada', 'Manta y antifaz'] },
  ],
}

export function servicesFor(bizId: string): Service[] {
  return CATALOG[bizId] ?? []
}

// Build the list of service ids to show in the chat (services only — no business
// cards). Direct service matches are kept; for any matched business that had NO
// specific service matched (e.g. searched by name), its whole catalog is added.
export function servicesForSearch(bizIds: string[], serviceIds: string[], catalog: Record<string, Service[]> = CATALOG): string[] {
  const ids = new Set(serviceIds)
  for (const bid of bizIds) {
    const hasOwn = serviceIds.some(sid => sid.startsWith(`${bid}-`))
    if (!hasOwn) for (const s of (catalog[bid] ?? [])) ids.add(s.id)
  }
  return [...ids]
}

// Resolve a service id (e.g. 'sereno-temazcal') to its service + owning business.
export function findService(serviceId: string, businesses: Business[] = BIZ, catalog: Record<string, Service[]> = CATALOG): { biz: Business; service: Service } | null {
  for (const [bizId, services] of Object.entries(catalog)) {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      const biz = businesses.find(b => b.id === bizId)
      if (biz) return { biz, service }
    }
  }
  return null
}

// Client-side keyword search over businesses + their services. Used as the
// chat fallback when the AI is unavailable, and matches both names.
export function localSearch(query: string, businesses: Business[] = BIZ, catalog: Record<string, Service[]> = CATALOG): { bizIds: string[]; serviceIds: string[] } {
  const q = query.trim().toLowerCase()
  const terms = q.split(/\s+/).filter(w => w.length > 2)
  if (terms.length === 0) return { bizIds: [], serviceIds: [] }
  const hit = (hay: string) => { const h = hay.toLowerCase(); return terms.some(t => h.includes(t)) }

  const bizIds = businesses.filter(b => hit([b.name, b.type, b.cat, b.hood, b.es, b.en, b.tags.join(' ')].join(' '))).map(b => b.id)
  const serviceIds: string[] = []
  for (const [bizId, services] of Object.entries(catalog)) {
    for (const s of services) {
      if (hit([s.name, s.sub, s.category].join(' '))) {
        serviceIds.push(s.id)
        if (!bizIds.includes(bizId)) bizIds.push(bizId)
      }
    }
  }
  return { bizIds: bizIds.slice(0, 12), serviceIds: serviceIds.slice(0, 12) }
}

export const COPY = {
  explorer: {
    greet: "I'm Reva — your local concierge.",
    sub: "Tell me what you're in the mood for and I'll handle the rest.",
    prompts: ['Where do locals eat tonight?', 'Sunset with a drink', 'Couples massage tomorrow', 'Plan my evening'],
    ph: 'Ask Reva anything…',
    discoverTitle: 'Tonight in Los Cabos',
    discoverSub: 'What locals are loving right now',
    tabs: { concierge: 'Reva', discover: 'Discover', bookings: 'Trips', rove: 'Reva+', profile: 'You' },
    cats: ['All', 'Eat', 'Spa', 'Tours', 'Nightlife'],
  },
  vecino: {
    greet: 'Soy Reva — tu conecte local.',
    sub: 'Dime qué necesitas y yo lo resuelvo.',
    prompts: ['Resérvame lo de siempre', 'Cita de spa mañana', 'Cena para 2 hoy', 'Algo para la noche'],
    ph: 'Pídele algo a Reva…',
    discoverTitle: 'Hoy en Los Cabos',
    discoverSub: 'Lo que está sonando entre locales',
    tabs: { concierge: 'Reva', discover: 'Explorar', bookings: 'Reservas', rove: 'Reva+', profile: 'Tú' },
    cats: ['Todo', 'Comer', 'Spa', 'Tours', 'Noche'],
  },
}

// ── Proactive alerts ──────────────────────────────────────
// Returns the first active alert whose time window matches right now.
// Empty `days` array means every day. Time comparison handles midnight-crossing.
export function activeAlert(businesses: Business[]): { biz: Business; alert: ProactiveAlert } | null {
  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const currentDay = now.getDay() // 0=Sun … 6=Sat

  for (const b of businesses) {
    for (const a of (b.alerts ?? [])) {
      if (!a.active) continue
      if (a.days.length > 0 && !a.days.includes(currentDay)) continue
      const [sh, sm] = a.startTime.split(':').map(Number)
      const [eh, em] = a.endTime.split(':').map(Number)
      const start = sh * 60 + sm
      let end = eh * 60 + em
      if (end <= start) end += 24 * 60 // crosses midnight
      if (currentMin >= start && currentMin < end) return { biz: b, alert: a }
    }
  }
  return null
}
