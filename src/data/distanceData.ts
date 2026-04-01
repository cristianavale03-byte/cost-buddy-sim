// Estimated one-way distances (km) from each origin to destinations.
// Key format: "OriginName|DestinationName" (case-sensitive, matching fleetData names).
// Values are approximate and editable.

const distancesOneWay: Record<string, number> = {
  // === From Gulpilhares/Espinho ===
  // Zona Local
  "Gulpilhares/Espinho|Ermesinde": 30,
  "Gulpilhares/Espinho|Gaia": 10,
  "Gulpilhares/Espinho|Maia": 25,
  "Gulpilhares/Espinho|Porto": 20,
  "Gulpilhares/Espinho|São Mamede de Infesta": 22,
  "Gulpilhares/Espinho|São Romão do Coronado": 30,
  "Gulpilhares/Espinho|Valongo": 32,

  // Zona Norte Alargada
  "Gulpilhares/Espinho|Argoncilhe": 8,
  "Gulpilhares/Espinho|Arouca": 55,
  "Gulpilhares/Espinho|Aveiro": 55,
  "Gulpilhares/Espinho|Braga": 75,
  "Gulpilhares/Espinho|Castelo de Paiva": 50,
  "Gulpilhares/Espinho|Escapães": 12,
  "Gulpilhares/Espinho|Esmoriz": 8,
  "Gulpilhares/Espinho|Espinho": 5,
  "Gulpilhares/Espinho|Esposende": 80,
  "Gulpilhares/Espinho|Estarreja": 40,
  "Gulpilhares/Espinho|Famalicão": 55,
  "Gulpilhares/Espinho|Felgueiras": 65,
  "Gulpilhares/Espinho|Grimancelos (Barcelos)": 75,
  "Gulpilhares/Espinho|Guimarães": 65,
  "Gulpilhares/Espinho|Lixa": 60,
  "Gulpilhares/Espinho|Lousada": 55,
  "Gulpilhares/Espinho|Milheiro de Poiares": 10,
  "Gulpilhares/Espinho|Oliveira de Azeméis": 25,
  "Gulpilhares/Espinho|Ovar": 20,
  "Gulpilhares/Espinho|Paços de Ferreira": 50,
  "Gulpilhares/Espinho|Paredes": 45,
  "Gulpilhares/Espinho|Penafiel": 50,
  "Gulpilhares/Espinho|Póvoa de Lanhoso": 80,
  "Gulpilhares/Espinho|Santo Tirso": 45,
  "Gulpilhares/Espinho|São João da Madeira": 18,
  "Gulpilhares/Espinho|São João de Ver": 15,
  "Gulpilhares/Espinho|Trofa": 40,
  "Gulpilhares/Espinho|Viana do Castelo": 100,
  "Gulpilhares/Espinho|Vila da Feira": 12,
  "Gulpilhares/Espinho|Vila do Conde": 45,
  "Gulpilhares/Espinho|Vila Meã": 55,
  "Gulpilhares/Espinho|Barcelos": 75,

  // Zona Interior
  "Gulpilhares/Espinho|Carregal do Sal": 140,
  "Gulpilhares/Espinho|Tondela": 130,
  "Gulpilhares/Espinho|Viseu": 130,
  "Gulpilhares/Espinho|Castro D'Aire": 150,
  "Gulpilhares/Espinho|S.P.Sul": 140,
  "Gulpilhares/Espinho|Castelo Branco": 260,
  "Gulpilhares/Espinho|Guarda": 230,

  // Zona Centro
  "Gulpilhares/Espinho|Alcobaça": 230,
  "Gulpilhares/Espinho|Benedita": 220,
  "Gulpilhares/Espinho|Leiria": 200,
  "Gulpilhares/Espinho|Lousã": 180,
  "Gulpilhares/Espinho|Marinha Grande": 210,
  "Gulpilhares/Espinho|Miranda do Corvo": 170,
  "Gulpilhares/Espinho|Oliveira de Frades": 100,
  "Gulpilhares/Espinho|Pombal": 190,
  "Gulpilhares/Espinho|Porto de Mós": 220,
  "Gulpilhares/Espinho|Santa Catarina da Serra": 200,
  "Gulpilhares/Espinho|Valado dos Frades": 220,
  "Gulpilhares/Espinho|Cantanhede": 140,
  "Gulpilhares/Espinho|Fátima": 210,
  "Gulpilhares/Espinho|Mealhada": 120,

  // Zona Sul Grande
  "Gulpilhares/Espinho|Abrantes": 260,
  "Gulpilhares/Espinho|Torres Novas": 240,
  "Gulpilhares/Espinho|Belmonte": 270,
  "Gulpilhares/Espinho|Covilhã": 270,
  "Gulpilhares/Espinho|Tortosendo": 275,

  // Zona Lisboa e Sul
  "Gulpilhares/Espinho|Alcoitão": 310,
  "Gulpilhares/Espinho|Alenquer": 290,
  "Gulpilhares/Espinho|Arcos de Valdevez": 130,
  "Gulpilhares/Espinho|Bombarral": 260,
  "Gulpilhares/Espinho|Caldas da Rainha": 250,
  "Gulpilhares/Espinho|Chamusca": 250,
  "Gulpilhares/Espinho|Constância": 250,
  "Gulpilhares/Espinho|Golegã": 245,
  "Gulpilhares/Espinho|Lisboa": 310,
  "Gulpilhares/Espinho|Lourinhã": 270,
  "Gulpilhares/Espinho|Mafra": 290,
  "Gulpilhares/Espinho|Monção": 140,
  "Gulpilhares/Espinho|Muge": 260,
  "Gulpilhares/Espinho|Óbidos": 255,
  "Gulpilhares/Espinho|Ourém/Caxarias": 220,
  "Gulpilhares/Espinho|Paredes de Coura": 120,
  "Gulpilhares/Espinho|Peniche": 270,
  "Gulpilhares/Espinho|Sacavém": 310,
  "Gulpilhares/Espinho|São Mamede": 22,
  "Gulpilhares/Espinho|Sertã": 230,
  "Gulpilhares/Espinho|Sesimbra": 330,
  "Gulpilhares/Espinho|Setúbal": 330,
  "Gulpilhares/Espinho|Talaide": 310,
  "Gulpilhares/Espinho|Tomar": 240,
  "Gulpilhares/Espinho|Valença": 130,
  "Gulpilhares/Espinho|Vila Nova de Cerveira": 125,
  "Gulpilhares/Espinho|Vila Real": 110,
  "Gulpilhares/Espinho|Alcanena": 230,
  "Gulpilhares/Espinho|Pedrogão Grande": 210,

  // Zona Alentejo / Sul
  "Gulpilhares/Espinho|Beja": 400,
  "Gulpilhares/Espinho|Cercal do Alentejo": 380,
  "Gulpilhares/Espinho|Évora": 370,
  "Gulpilhares/Espinho|Grandola": 350,
  "Gulpilhares/Espinho|Montemor-o-Novo": 360,
  "Gulpilhares/Espinho|Portalegre": 350,
  "Gulpilhares/Espinho|Vendas Novas": 340,

  // === From Meirinhas ===
  "Meirinhas|Águeda": 80,
  "Meirinhas|Estarreja": 100,
  "Meirinhas|Oliveira de Azeméis": 110,
  "Meirinhas|Vale de Cambra": 120,
  "Meirinhas|Figueira da Foz": 70,
  "Meirinhas|Leiria": 30,
  "Meirinhas|Marinha Grande": 40,
  "Meirinhas|Pombal": 10,
  "Meirinhas|Soure": 40,
  "Meirinhas|Zona Lisboa": 180,
  "Meirinhas|Torres Novas": 80,
  "Meirinhas|Vila Nova de Gaia": 210,
  "Meirinhas|Rio Tinto": 210,
  "Meirinhas|Guarda": 200,

  // === From Maia ===
  "Maia|Barcelos": 55,
  "Maia|Braga": 50,
  "Maia|Esposende": 60,
  "Maia|Estarreja": 55,
  "Maia|Felgueiras": 50,
  "Maia|Grimancelos (Barcelos)": 55,
  "Maia|Guimarães": 45,
  "Maia|Lixa": 50,
  "Maia|Póvoa de Lanhoso": 60,
  "Maia|Viana do Castelo": 80,
  "Maia|Lousada": 40,
  "Maia|Lustosa": 45,
  "Maia|Paços de Ferreira": 30,
  "Maia|Paredes": 30,
  "Maia|Penafiel": 40,
  "Maia|Santo Tirso": 20,
  "Maia|Trofa": 15,
  "Maia|Vila do Conde": 25,
  "Maia|Vila Nova de Famalicão": 35,
  "Maia|Arcos de Valdevez": 110,
  "Maia|Formariz": 110,
  "Maia|Monção": 120,
  "Maia|Valença": 110,
  "Maia|Vila Nova de Cerveira": 105,
  "Maia|Vila Real": 90,
};

/**
 * Get estimated round-trip distance (km) between origin and destination.
 * Returns the one-way distance × 2, or null if not found.
 */
export function getEstimatedRoundTripKm(origin: string, destination: string): number | null {
  const key = `${origin}|${destination}`;
  const oneWay = distancesOneWay[key];
  if (oneWay !== undefined) return oneWay * 2;
  return null;
}

/**
 * Get estimated round-trip for Construction (origin always Espinho = Gulpilhares/Espinho).
 */
export function getConstructionRoundTripKm(destination: string): number | null {
  return getEstimatedRoundTripKm("Gulpilhares/Espinho", destination);
}
