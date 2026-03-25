// Fleet cost data extracted from AGI Excel model + Pombalense PDF tables (2026-02-01, +2.5%)

export interface FleetVehicle {
  name: string;
  costPerKm: number;
  capacityTon: number;
  capacityMeters: number;
}

export const fleetVehicles: FleetVehicle[] = [
  { name: "Frota 6t (4m)", costPerKm: 0.995378, capacityTon: 6, capacityMeters: 4 },
  { name: "Frota 9t (6m)", costPerKm: 1.077271, capacityTon: 9, capacityMeters: 6 },
  { name: "Frota 15t (9m)", costPerKm: 1.166973, capacityTon: 15, capacityMeters: 9 },
];

export interface PombalensePriceEntry {
  kgUpTo: number;
  cost: number;
  originId: number;
  destId: number;
}

// ========== CF (Carga Fracionada) — Weight-based prices ==========
// Origin 1 = Gulpilhares/Espinho, Origin 2 = Meirinhas, Origin 3 = Maia

export interface CFZone {
  originId: number;
  originName: string;
  zoneId: number;
  zoneName: string;
  destinations: string[];
  minKg: number;
  prices: { kgUpTo: number; cost: number }[];
  beyondTenTonPerTon?: number; // €/ton for weight > 10t
  fullLoadPrices?: { threeAxle?: number; trailer?: number }; // 3 Eixos / Reboque
}

export const cfZones: CFZone[] = [
  // === ORIGIN: Gulpilhares/Espinho ===
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 1,
    zoneName: "Zona Interior (Carregal do Sal, Tondela, Viseu, etc.)",
    destinations: ["Carregal do Sal", "Tondela", "Viseu", "Castro D'Aire", "S.P.Sul", "Castelo Branco", "Guarda"],
    minKg: 510,
    prices: [
      {kgUpTo:510,cost:80},{kgUpTo:765,cost:101},{kgUpTo:1020,cost:121},{kgUpTo:1275,cost:141},
      {kgUpTo:1530,cost:161},{kgUpTo:1785,cost:183},{kgUpTo:2040,cost:204},
      {kgUpTo:2550,cost:223},{kgUpTo:3500,cost:228},{kgUpTo:4500,cost:252},
      {kgUpTo:5700,cost:277},{kgUpTo:6500,cost:288},{kgUpTo:7500,cost:296},
    ],
  },
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 2,
    zoneName: "Zona Centro (Alcobaça, Leiria, Pombal, etc.)",
    destinations: ["Alcobaça","Benedita","Leiria","Lousã","Marinha Grande","Miranda do Corvo",
      "Oliveira de Frades","Pombal","Porto de Mós","Santa Catarina da Serra","Valado dos Frades",
      "Cantanhede","Fátima","Mealhada"],
    minKg: 250,
    prices: [
      {kgUpTo:250,cost:26},{kgUpTo:300,cost:28},{kgUpTo:350,cost:32},{kgUpTo:400,cost:35},
      {kgUpTo:450,cost:37},{kgUpTo:500,cost:40},{kgUpTo:600,cost:46},{kgUpTo:700,cost:51},
      {kgUpTo:800,cost:56},{kgUpTo:900,cost:60},{kgUpTo:1000,cost:64},{kgUpTo:1100,cost:69},
      {kgUpTo:1200,cost:72},{kgUpTo:1300,cost:76},{kgUpTo:1400,cost:80},{kgUpTo:1500,cost:84},
      {kgUpTo:1600,cost:89},{kgUpTo:1700,cost:94},{kgUpTo:1800,cost:98},{kgUpTo:1900,cost:101},
      {kgUpTo:2000,cost:107},{kgUpTo:2200,cost:114},
    ],
    beyondTenTonPerTon: 22,
  },
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 3,
    zoneName: "Zona Sul Grande (Abrantes, Torres Novas, etc.)",
    destinations: ["Abrantes","Torres Novas","Belmonte","Covilhã","Tortosendo"],
    minKg: 250,
    prices: [
      {kgUpTo:250,cost:130},{kgUpTo:300,cost:137},{kgUpTo:350,cost:145},{kgUpTo:400,cost:150},
      {kgUpTo:450,cost:155},{kgUpTo:500,cost:164},{kgUpTo:600,cost:170},{kgUpTo:700,cost:176},
      {kgUpTo:800,cost:182},{kgUpTo:900,cost:190},{kgUpTo:1000,cost:195},{kgUpTo:1100,cost:200},
      {kgUpTo:1200,cost:205},{kgUpTo:1300,cost:209},{kgUpTo:1400,cost:216},{kgUpTo:1500,cost:221},
      {kgUpTo:1600,cost:226},{kgUpTo:1700,cost:231},{kgUpTo:1800,cost:236},{kgUpTo:1900,cost:242},
      {kgUpTo:2000,cost:246},{kgUpTo:2200,cost:253},{kgUpTo:2400,cost:260},{kgUpTo:2600,cost:265},
      {kgUpTo:2800,cost:270},{kgUpTo:3000,cost:276},{kgUpTo:3300,cost:281},{kgUpTo:3600,cost:286},
      {kgUpTo:3900,cost:291},{kgUpTo:4200,cost:296},{kgUpTo:4500,cost:303},{kgUpTo:4800,cost:308},
      {kgUpTo:5100,cost:312},{kgUpTo:5400,cost:316},{kgUpTo:5800,cost:320},{kgUpTo:6200,cost:323},
      {kgUpTo:6600,cost:327},{kgUpTo:7000,cost:331},{kgUpTo:7500,cost:337},{kgUpTo:8000,cost:340},
      {kgUpTo:8500,cost:343},{kgUpTo:9000,cost:349},{kgUpTo:9500,cost:353},{kgUpTo:10000,cost:357},
    ],
  },
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 4,
    zoneName: "Belmonte / Covilhã / Tortosendo",
    destinations: ["Belmonte","Covilhã","Tortosendo"],
    minKg: 250,
    prices: [
      {kgUpTo:250,cost:122},{kgUpTo:300,cost:129},{kgUpTo:350,cost:132},{kgUpTo:400,cost:136},
      {kgUpTo:450,cost:138},{kgUpTo:500,cost:140},{kgUpTo:600,cost:146},{kgUpTo:700,cost:151},
      {kgUpTo:800,cost:154},{kgUpTo:900,cost:157},{kgUpTo:1000,cost:161},{kgUpTo:1100,cost:169},
      {kgUpTo:1200,cost:173},{kgUpTo:1300,cost:176},{kgUpTo:1400,cost:179},{kgUpTo:1500,cost:185},
      {kgUpTo:1600,cost:188},{kgUpTo:1700,cost:191},{kgUpTo:1800,cost:197},{kgUpTo:1900,cost:203},
      {kgUpTo:2000,cost:206},{kgUpTo:2200,cost:239},{kgUpTo:2400,cost:247},{kgUpTo:2600,cost:256},
      {kgUpTo:2800,cost:264},{kgUpTo:3000,cost:271},{kgUpTo:3300,cost:277},{kgUpTo:3600,cost:281},
      {kgUpTo:3900,cost:284},{kgUpTo:4200,cost:290},{kgUpTo:4500,cost:293},{kgUpTo:4800,cost:296},
      {kgUpTo:5100,cost:302},{kgUpTo:5400,cost:305},{kgUpTo:5800,cost:310},{kgUpTo:6200,cost:313},
      {kgUpTo:6600,cost:316},{kgUpTo:7000,cost:320},{kgUpTo:7500,cost:322},{kgUpTo:8000,cost:325},
      {kgUpTo:8500,cost:327},{kgUpTo:9000,cost:330},{kgUpTo:9500,cost:332},{kgUpTo:10000,cost:335},
    ],
  },
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 5,
    zoneName: "Zona Lisboa / Torres Novas / Sertã / etc.",
    destinations: ["Alcoitão","Alenquer","Arcos de Valdevez","Bombarral","Caldas da Rainha",
      "Chamusca","Constância","Golegã","Lisboa","Lourinhã","Mafra","Monção","Muge","Óbidos",
      "Ourém/Caxarias","Paredes de Coura","Peniche","Sacavém","São Mamede","Sertã","Sesimbra",
      "Setúbal","Talaide","Tomar","Torres Novas","Valença","Vila Nova de Cerveira","Vila Real",
      "Alcanena","Pedrogão Grande"],
    minKg: 400,
    prices: [
      {kgUpTo:400,cost:39},{kgUpTo:450,cost:42},{kgUpTo:500,cost:45},{kgUpTo:600,cost:50},
      {kgUpTo:700,cost:57},{kgUpTo:800,cost:60},{kgUpTo:900,cost:67},{kgUpTo:1000,cost:71},
      {kgUpTo:1100,cost:76},{kgUpTo:1200,cost:79},{kgUpTo:1300,cost:83},{kgUpTo:1400,cost:89},
      {kgUpTo:1500,cost:94},{kgUpTo:1600,cost:98},{kgUpTo:1700,cost:103},{kgUpTo:1800,cost:108},
      {kgUpTo:1900,cost:112},{kgUpTo:2000,cost:115},{kgUpTo:2200,cost:126},{kgUpTo:2400,cost:136},
      {kgUpTo:2600,cost:146},
    ],
  },
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 6,
    zoneName: "Zona Alentejo / Sul",
    destinations: ["Beja","Cercal do Alentejo","Évora","Grandola","Montemor-o-Novo","Portalegre","Vendas Novas"],
    minKg: 400,
    prices: [
      {kgUpTo:400,cost:129},{kgUpTo:450,cost:134},{kgUpTo:500,cost:141},{kgUpTo:600,cost:149},
      {kgUpTo:700,cost:154},{kgUpTo:800,cost:160},{kgUpTo:900,cost:169},{kgUpTo:1000,cost:175},
      {kgUpTo:1100,cost:181},{kgUpTo:1200,cost:188},{kgUpTo:1300,cost:196},{kgUpTo:1400,cost:203},
      {kgUpTo:1500,cost:209},{kgUpTo:1600,cost:213},{kgUpTo:1700,cost:218},{kgUpTo:1800,cost:226},
      {kgUpTo:1900,cost:231},{kgUpTo:2000,cost:235},{kgUpTo:2200,cost:240},{kgUpTo:2400,cost:245},
      {kgUpTo:2600,cost:251},
    ],
  },
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 7,
    zoneName: "Zona Local (Porto, Gaia, Maia, Ermesinde, etc.)",
    destinations: ["Ermesinde","Gaia","Maia","Porto","São Mamede de Infesta","São Romão do Coronado","Valongo"],
    minKg: 500,
    prices: [
      {kgUpTo:500,cost:21},{kgUpTo:600,cost:21},{kgUpTo:700,cost:23},{kgUpTo:800,cost:24},
      {kgUpTo:900,cost:26},{kgUpTo:1000,cost:27},{kgUpTo:1100,cost:30},{kgUpTo:1200,cost:31},
      {kgUpTo:1300,cost:33},{kgUpTo:1400,cost:34},{kgUpTo:1500,cost:36},{kgUpTo:1600,cost:38},
      {kgUpTo:1700,cost:39},{kgUpTo:1800,cost:42},{kgUpTo:1900,cost:44},{kgUpTo:2000,cost:47},
      {kgUpTo:2200,cost:50},{kgUpTo:2400,cost:53},{kgUpTo:2600,cost:56},{kgUpTo:2800,cost:59},
      {kgUpTo:3000,cost:66},{kgUpTo:3300,cost:67},{kgUpTo:3600,cost:70},{kgUpTo:3900,cost:71},
      {kgUpTo:4200,cost:73},{kgUpTo:4500,cost:74},{kgUpTo:4800,cost:77},{kgUpTo:5100,cost:78},
      {kgUpTo:5400,cost:79},{kgUpTo:5800,cost:80},{kgUpTo:6200,cost:81},{kgUpTo:6600,cost:83},
      {kgUpTo:7000,cost:84},{kgUpTo:7500,cost:86},{kgUpTo:8000,cost:87},{kgUpTo:8500,cost:89},
      {kgUpTo:9000,cost:90},{kgUpTo:9500,cost:93},{kgUpTo:10000,cost:94},
    ],
    beyondTenTonPerTon: 10,
  },
  {
    originId: 1, originName: "Gulpilhares/Espinho", zoneId: 8,
    zoneName: "Zona Norte Alargada (Barcelos, Braga, Aveiro, etc.)",
    destinations: ["Argoncilhe","Arouca","Aveiro","Braga","Castelo de Paiva","Escapães","Esmoriz",
      "Espinho","Esposende","Estarreja","Famalicão","Felgueiras","Grimancelos (Barcelos)",
      "Guimarães","Lixa","Lousada","Milheiro de Poiares","Oliveira de Azeméis","Ovar",
      "Paços de Ferreira","Paredes","Penafiel","Póvoa de Lanhoso","Santo Tirso",
      "São João da Madeira","São João de Ver","Trofa","Viana do Castelo","Vila da Feira",
      "Vila do Conde","Vila Meã","Barcelos"],
    minKg: 500,
    prices: [
      {kgUpTo:500,cost:32},{kgUpTo:600,cost:35},{kgUpTo:700,cost:39},{kgUpTo:800,cost:42},
      {kgUpTo:900,cost:46},{kgUpTo:1000,cost:50},{kgUpTo:1100,cost:53},{kgUpTo:1200,cost:57},
      {kgUpTo:1300,cost:59},{kgUpTo:1400,cost:63},{kgUpTo:1500,cost:66},{kgUpTo:1600,cost:70},
      {kgUpTo:1700,cost:72},{kgUpTo:1800,cost:76},{kgUpTo:1900,cost:78},{kgUpTo:2000,cost:81},
      {kgUpTo:2200,cost:87},{kgUpTo:2400,cost:96},{kgUpTo:2600,cost:101},{kgUpTo:2800,cost:109},
      {kgUpTo:3000,cost:114},{kgUpTo:3300,cost:117},{kgUpTo:3600,cost:120},{kgUpTo:3900,cost:122},
      {kgUpTo:4200,cost:129},{kgUpTo:4500,cost:131},{kgUpTo:4800,cost:134},{kgUpTo:5100,cost:137},
      {kgUpTo:5400,cost:139},{kgUpTo:5800,cost:141},{kgUpTo:6200,cost:146},{kgUpTo:6600,cost:149},
      {kgUpTo:7000,cost:151},{kgUpTo:7500,cost:152},{kgUpTo:8000,cost:154},{kgUpTo:8500,cost:155},
      {kgUpTo:9000,cost:157},{kgUpTo:9500,cost:160},{kgUpTo:10000,cost:161},
    ],
    beyondTenTonPerTon: 17,
  },

  // === ORIGIN: Meirinhas ===
  {
    originId: 2, originName: "Meirinhas", zoneId: 9,
    zoneName: "Águeda / Estarreja / OAZ / Vale de Cambra",
    destinations: ["Águeda","Estarreja","Oliveira de Azeméis","Vale de Cambra"],
    minKg: 400,
    prices: [
      {kgUpTo:400,cost:36},{kgUpTo:450,cost:39},{kgUpTo:500,cost:43},{kgUpTo:600,cost:48},
      {kgUpTo:700,cost:55},{kgUpTo:800,cost:58},{kgUpTo:900,cost:63},{kgUpTo:1000,cost:67},
      {kgUpTo:1100,cost:72},{kgUpTo:1200,cost:76},{kgUpTo:1300,cost:79},{kgUpTo:1400,cost:83},
      {kgUpTo:1500,cost:89},{kgUpTo:1600,cost:94},{kgUpTo:1700,cost:98},{kgUpTo:1800,cost:101},
      {kgUpTo:1900,cost:107},{kgUpTo:2000,cost:111},{kgUpTo:2200,cost:119},{kgUpTo:2400,cost:129},
      {kgUpTo:2600,cost:137},
    ],
    fullLoadPrices: { threeAxle: 297, trailer: 333 },
  },
  {
    originId: 2, originName: "Meirinhas", zoneId: 10,
    zoneName: "Figueira da Foz / Leiria / Marinha Grande / Pombal / Soure",
    destinations: ["Figueira da Foz","Leiria","Marinha Grande","Pombal","Soure"],
    minKg: 500,
    prices: [
      {kgUpTo:500,cost:32},{kgUpTo:600,cost:35},{kgUpTo:700,cost:39},{kgUpTo:800,cost:42},
      {kgUpTo:900,cost:46},{kgUpTo:1000,cost:50},{kgUpTo:1100,cost:53},{kgUpTo:1200,cost:57},
      {kgUpTo:1300,cost:59},{kgUpTo:1400,cost:63},{kgUpTo:1500,cost:66},{kgUpTo:1600,cost:70},
      {kgUpTo:1700,cost:72},{kgUpTo:1800,cost:76},{kgUpTo:1900,cost:78},{kgUpTo:2000,cost:81},
      {kgUpTo:2200,cost:87},{kgUpTo:2400,cost:96},{kgUpTo:2600,cost:101},{kgUpTo:2800,cost:109},
    ],
    fullLoadPrices: { threeAxle: 192, trailer: 213 },
  },
  {
    originId: 2, originName: "Meirinhas", zoneId: 11,
    zoneName: "Zona Lisboa / Torres Novas",
    destinations: ["Zona Lisboa","Torres Novas"],
    minKg: 250,
    prices: [
      {kgUpTo:250,cost:26},{kgUpTo:300,cost:28},{kgUpTo:350,cost:32},{kgUpTo:400,cost:35},
      {kgUpTo:450,cost:37},{kgUpTo:500,cost:40},{kgUpTo:600,cost:46},{kgUpTo:700,cost:51},
      {kgUpTo:800,cost:56},{kgUpTo:900,cost:60},{kgUpTo:1000,cost:64},{kgUpTo:1100,cost:69},
      {kgUpTo:1200,cost:72},{kgUpTo:1300,cost:76},{kgUpTo:1400,cost:80},{kgUpTo:1500,cost:84},
      {kgUpTo:1600,cost:89},{kgUpTo:1700,cost:94},{kgUpTo:1800,cost:98},{kgUpTo:1900,cost:101},
      {kgUpTo:2000,cost:107},{kgUpTo:2200,cost:114},
    ],
    beyondTenTonPerTon: 22,
  },
  {
    originId: 2, originName: "Meirinhas", zoneId: 12,
    zoneName: "Vila Nova de Gaia / Rio Tinto",
    destinations: ["Vila Nova de Gaia","Rio Tinto"],
    minKg: 250,
    prices: [
      {kgUpTo:250,cost:26},{kgUpTo:300,cost:28},{kgUpTo:350,cost:32},{kgUpTo:400,cost:35},
      {kgUpTo:450,cost:37},{kgUpTo:500,cost:40},{kgUpTo:600,cost:46},{kgUpTo:700,cost:51},
      {kgUpTo:800,cost:56},{kgUpTo:900,cost:60},{kgUpTo:1000,cost:64},{kgUpTo:1100,cost:69},
      {kgUpTo:1200,cost:72},{kgUpTo:1300,cost:76},{kgUpTo:1400,cost:80},{kgUpTo:1500,cost:84},
      {kgUpTo:1600,cost:89},{kgUpTo:1700,cost:94},{kgUpTo:1800,cost:98},{kgUpTo:1900,cost:101},
      {kgUpTo:2000,cost:107},{kgUpTo:2200,cost:114},
    ],
    beyondTenTonPerTon: 22,
  },
  {
    originId: 2, originName: "Meirinhas", zoneId: 13,
    zoneName: "Guarda",
    destinations: ["Guarda"],
    minKg: 510,
    prices: [
      {kgUpTo:510,cost:83},{kgUpTo:765,cost:89},{kgUpTo:1020,cost:94},{kgUpTo:1275,cost:98},
      {kgUpTo:1530,cost:103},{kgUpTo:1785,cost:108},{kgUpTo:2040,cost:112},
      {kgUpTo:2550,cost:198},{kgUpTo:3500,cost:203},{kgUpTo:4500,cost:205},
      {kgUpTo:5700,cost:209},{kgUpTo:6500,cost:212},{kgUpTo:7500,cost:213},
    ],
    fullLoadPrices: { threeAxle: 399, trailer: 485 },
  },

  // === ORIGIN: Maia ===
  {
    originId: 3, originName: "Maia", zoneId: 14,
    zoneName: "Barcelos / Braga / Esposende / Estarreja / etc.",
    destinations: ["Barcelos","Braga","Esposende","Estarreja","Felgueiras","Grimancelos (Barcelos)",
      "Guimarães","Lixa","Póvoa de Lanhoso","Viana do Castelo"],
    minKg: 500,
    prices: [
      {kgUpTo:500,cost:32},{kgUpTo:600,cost:35},{kgUpTo:700,cost:39},{kgUpTo:800,cost:42},
      {kgUpTo:900,cost:46},{kgUpTo:1000,cost:50},{kgUpTo:1100,cost:53},{kgUpTo:1200,cost:57},
      {kgUpTo:1300,cost:59},{kgUpTo:1400,cost:63},{kgUpTo:1500,cost:66},{kgUpTo:1600,cost:70},
      {kgUpTo:1700,cost:72},{kgUpTo:1800,cost:76},{kgUpTo:1900,cost:78},{kgUpTo:2000,cost:81},
      {kgUpTo:2200,cost:87},{kgUpTo:2400,cost:96},{kgUpTo:2600,cost:101},{kgUpTo:2800,cost:109},
    ],
    beyondTenTonPerTon: 16,
  },
  {
    originId: 3, originName: "Maia", zoneId: 15,
    zoneName: "Lousada / Paços Ferreira / Paredes / Penafiel / etc.",
    destinations: ["Lousada","Lustosa","Paços de Ferreira","Paredes","Penafiel","Santo Tirso",
      "Trofa","Vila do Conde","Vila Nova de Famalicão"],
    minKg: 500,
    prices: [
      {kgUpTo:500,cost:30},{kgUpTo:600,cost:32},{kgUpTo:700,cost:35},{kgUpTo:800,cost:37},
      {kgUpTo:900,cost:42},{kgUpTo:1000,cost:45},{kgUpTo:1100,cost:48},{kgUpTo:1200,cost:50},
      {kgUpTo:1300,cost:55},{kgUpTo:1400,cost:57},{kgUpTo:1500,cost:59},{kgUpTo:1600,cost:62},
      {kgUpTo:1700,cost:66},{kgUpTo:1800,cost:69},{kgUpTo:1900,cost:71},{kgUpTo:2000,cost:73},
      {kgUpTo:2200,cost:78},{kgUpTo:2400,cost:84},{kgUpTo:2600,cost:93},{kgUpTo:2800,cost:97},
    ],
    beyondTenTonPerTon: 15,
  },
  {
    originId: 3, originName: "Maia", zoneId: 16,
    zoneName: "Arcos de Valdevez / Monção / Valença / Vila Real / etc.",
    destinations: ["Arcos de Valdevez","Formariz","Monção","Valença","Vila Nova de Cerveira","Vila Real"],
    minKg: 400,
    prices: [
      {kgUpTo:400,cost:36},{kgUpTo:450,cost:39},{kgUpTo:500,cost:43},{kgUpTo:600,cost:48},
      {kgUpTo:700,cost:55},{kgUpTo:800,cost:58},{kgUpTo:900,cost:63},{kgUpTo:1000,cost:67},
      {kgUpTo:1100,cost:72},{kgUpTo:1200,cost:76},{kgUpTo:1300,cost:79},{kgUpTo:1400,cost:83},
      {kgUpTo:1500,cost:89},{kgUpTo:1600,cost:94},{kgUpTo:1700,cost:98},{kgUpTo:1800,cost:101},
      {kgUpTo:1900,cost:107},{kgUpTo:2000,cost:111},{kgUpTo:2200,cost:119},{kgUpTo:2400,cost:129},
      {kgUpTo:2600,cost:137},{kgUpTo:2800,cost:141},{kgUpTo:3000,cost:150},{kgUpTo:3300,cost:154},
      {kgUpTo:3600,cost:157},{kgUpTo:3900,cost:161},{kgUpTo:4200,cost:168},{kgUpTo:4500,cost:173},
      {kgUpTo:4800,cost:176},{kgUpTo:5100,cost:179},{kgUpTo:5400,cost:185},{kgUpTo:5800,cost:187},
      {kgUpTo:6200,cost:190},{kgUpTo:6600,cost:192},{kgUpTo:7000,cost:198},{kgUpTo:7500,cost:203},
      {kgUpTo:8000,cost:204},{kgUpTo:8500,cost:206},{kgUpTo:9000,cost:209},{kgUpTo:9500,cost:212},
      {kgUpTo:10000,cost:214},
    ],
  },
];

// ========== CC (Cargas Completas) — Construction prices by destination ==========
export interface CCPriceEntry {
  destination: string;
  chapas2x1?: number;
  chapas3x2?: number;
  chapas4a6?: number;
  chapas7a8?: number;
  threeAxle?: number;
  trailer?: number;
}

export const ccPrices: CCPriceEntry[] = [
  {destination:"Abrantes",chapas3x2:148,chapas4a6:213,chapas7a8:301,threeAxle:354,trailer:445},
  {destination:"Agilde",chapas3x2:187,chapas4a6:201,chapas7a8:240},
  {destination:"Aguada de Cima",chapas3x2:168,chapas7a8:179,threeAxle:218},
  {destination:"Águeda",chapas3x2:134,chapas4a6:168,chapas7a8:201,threeAxle:201,trailer:227},
  {destination:"Albergaria-a-Velha",chapas2x1:108,chapas3x2:134,chapas4a6:168,chapas7a8:201,threeAxle:201,trailer:227},
  {destination:"Alcacer do Sal",chapas3x2:301,chapas4a6:365,chapas7a8:566,threeAxle:566,trailer:626},
  {destination:"Almada",chapas7a8:358,threeAxle:452},
  {destination:"Amarante",chapas3x2:187,chapas4a6:213,chapas7a8:233,threeAxle:233,trailer:267},
  {destination:"Amares",chapas7a8:233,threeAxle:267},
  {destination:"Anadia",chapas3x2:148,chapas4a6:187,chapas7a8:218,threeAxle:218,trailer:253},
  {destination:"Arada",chapas7a8:179,threeAxle:218},
  {destination:"Arcos de Valdevez",chapas7a8:253,threeAxle:301},
  {destination:"Arganil",chapas3x2:240,chapas4a6:267,chapas7a8:313,threeAxle:313,trailer:332},
  {destination:"Argoncilhe",chapas7a8:134,threeAxle:153},
  {destination:"Armamar",chapas7a8:347,threeAxle:420},
  {destination:"Arouca",chapas3x2:168,chapas4a6:179,chapas7a8:201,threeAxle:201,trailer:247},
  {destination:"Aveiro",chapas3x2:134,chapas4a6:168,chapas7a8:174,threeAxle:174,trailer:218},
  {destination:"Avelãs de Caminha",chapas7a8:218,threeAxle:253},
  {destination:"Baguim do Monte",chapas7a8:134,threeAxle:153},
  {destination:"Baião",chapas3x2:187,chapas4a6:218,chapas7a8:240},
  {destination:"Barcelos",chapas3x2:134,chapas4a6:174,chapas7a8:192,threeAxle:192,trailer:233},
  {destination:"Beja",chapas3x2:267,chapas4a6:332,chapas7a8:533},
  {destination:"Belmonte",chapas3x2:301,chapas4a6:332,chapas7a8:433,threeAxle:466,trailer:560},
  {destination:"Benavente",threeAxle:354,trailer:445},
  {destination:"Bombarral",chapas3x2:148,chapas4a6:213,chapas7a8:301,threeAxle:347,trailer:433},
  {destination:"Braga",chapas3x2:134,chapas4a6:174,chapas7a8:192,threeAxle:227,trailer:247},
  {destination:"Bragança",chapas3x2:267,chapas4a6:332,chapas7a8:466,threeAxle:514,trailer:566},
  {destination:"Cabeceira de Bastos",chapas3x2:187,chapas4a6:218,chapas7a8:253,threeAxle:253,trailer:301},
  {destination:"Caldas da Rainha",chapas3x2:148,chapas4a6:213,chapas7a8:301,threeAxle:347,trailer:433},
  {destination:"Caldas São Jorge",threeAxle:174,trailer:213},
  {destination:"Caminha",chapas3x2:187,chapas4a6:201,chapas7a8:240,threeAxle:253,trailer:301},
  {destination:"Campo Besteiros",chapas3x2:240,chapas4a6:267,chapas7a8:306,threeAxle:306,trailer:372},
  {destination:"Campo Maior",chapas3x2:301,chapas4a6:365,chapas7a8:566,threeAxle:566,trailer:626},
  {destination:"Cantanhede",chapas3x2:134,chapas4a6:187,chapas7a8:227,threeAxle:267,trailer:326},
  {destination:"Carregal do Sal",threeAxle:306,trailer:386},
  {destination:"Castelo Branco",chapas3x2:267,chapas4a6:332,chapas7a8:399,threeAxle:466,trailer:560},
  {destination:"Castelo de Paiva",chapas3x2:159,chapas4a6:174,chapas7a8:187,threeAxle:192,trailer:233},
  {destination:"Castro D'Aire",chapas3x2:213,chapas4a6:301,chapas7a8:365},
  {destination:"Castro Verde",chapas3x2:267,chapas4a6:332,chapas7a8:533},
  {destination:"Caxarias",chapas3x2:179,chapas4a6:198,threeAxle:280,trailer:332},
  {destination:"Celorico da Beira",threeAxle:392,trailer:466},
  {destination:"Celorico de Bastos",chapas3x2:187,chapas4a6:201,chapas7a8:240},
  {destination:"Chaves",chapas3x2:267,chapas4a6:332,chapas7a8:433,threeAxle:433,trailer:466},
  {destination:"Coimbra",chapas2x1:134,chapas3x2:148,chapas4a6:192,chapas7a8:240,threeAxle:253,trailer:301},
  {destination:"Condeixa",chapas2x1:134,chapas3x2:148,chapas4a6:192,chapas7a8:240,threeAxle:253,trailer:301},
  {destination:"Covilhã",chapas3x2:267,chapas4a6:332,chapas7a8:433,threeAxle:466,trailer:560},
  {destination:"Cuba",chapas3x2:301,chapas4a6:365,chapas7a8:566},
  {destination:"Cucujães",threeAxle:174,trailer:201},
  {destination:"Elvas",chapas3x2:301,chapas4a6:365,chapas7a8:566},
  {destination:"Escapães",chapas3x2:100,chapas4a6:128,chapas7a8:134,threeAxle:140,trailer:168},
  {destination:"Esmoriz",threeAxle:140,trailer:168},
  {destination:"Esposende",chapas3x2:134,chapas4a6:174,chapas7a8:192,threeAxle:227,trailer:267},
  {destination:"Estarreja",threeAxle:179,trailer:218},
  {destination:"Estremoz",chapas3x2:100,chapas4a6:128,chapas7a8:148,threeAxle:499,trailer:626},
  {destination:"Évora",chapas3x2:301,chapas4a6:365,chapas7a8:566,threeAxle:566,trailer:626},
  {destination:"Fafe",chapas3x2:134,chapas4a6:174,chapas7a8:213,threeAxle:233,trailer:286},
  {destination:"Fajões",threeAxle:179,trailer:213},
  {destination:"Famalicão",chapas3x2:113,chapas4a6:140,chapas7a8:159,threeAxle:168,trailer:201},
  {destination:"Faro",threeAxle:800,trailer:931},
  {destination:"Feira",chapas3x2:100,chapas4a6:128,chapas7a8:134,threeAxle:140,trailer:168},
  {destination:"Felgueiras",chapas3x2:134,chapas4a6:174,chapas7a8:192,threeAxle:227,trailer:253},
  {destination:"Fiães",threeAxle:140,trailer:168},
  {destination:"Fundão",chapas2x1:215,chapas3x2:267,chapas4a6:332,chapas7a8:433},
  {destination:"Gafanha da Encarnação",chapas3x2:134,chapas4a6:168,chapas7a8:201,threeAxle:201,trailer:227},
  {destination:"Gafanha da Nazaré",threeAxle:174,trailer:218},
  {destination:"Gondomar",chapas3x2:100,chapas4a6:128,chapas7a8:134,threeAxle:134,trailer:153},
  {destination:"Gouveia",chapas3x2:213,chapas4a6:301,chapas7a8:365},
  {destination:"Grandola",chapas2x1:256,chapas3x2:301,chapas4a6:365,chapas7a8:566,threeAxle:566,trailer:626},
  {destination:"Grijó",threeAxle:134,trailer:153},
  {destination:"Grimancelos (Barcelos)",chapas3x2:134,chapas4a6:174,chapas7a8:192,threeAxle:192,trailer:233},
  {destination:"Guarda",chapas3x2:213,chapas4a6:301,chapas7a8:365,threeAxle:399,trailer:485},
  {destination:"Guimarães",chapas2x1:138,chapas3x2:159,chapas4a6:174,chapas7a8:192,threeAxle:192,trailer:247},
  {destination:"Ílhavo",chapas3x2:134,chapas4a6:168,chapas7a8:201,threeAxle:201,trailer:227},
  {destination:"Lagos",chapas2x1:267,chapas3x2:399,chapas4a6:599,chapas7a8:731,threeAxle:800,trailer:931},
  {destination:"Lamego",chapas3x2:267,chapas4a6:332,chapas7a8:399,threeAxle:466,trailer:560},
  {destination:"Lousã",chapas3x2:148,chapas4a6:201,chapas7a8:267},
  {destination:"Lousada",chapas3x2:134,chapas4a6:174,chapas7a8:192,threeAxle:227,trailer:253},
  {destination:"Lustosa",chapas3x2:134,chapas4a6:174,chapas7a8:192,threeAxle:227,trailer:253},
  {destination:"Mação",chapas3x2:148,chapas4a6:213,chapas7a8:301},
  {destination:"Macedo de Cavaleiros",chapas3x2:267,chapas4a6:332,chapas7a8:433,threeAxle:433,trailer:499},
  {destination:"Macinhata do Vouga",threeAxle:179,trailer:227},
  {destination:"Maia",chapas2x1:78,chapas3x2:100,chapas4a6:128,chapas7a8:134,threeAxle:134,trailer:153},
  {destination:"Mangualde",chapas2x1:198,chapas3x2:240,chapas4a6:267,chapas7a8:306,threeAxle:306,trailer:372},
  {destination:"Marco de Canavezes",chapas3x2:168,chapas4a6:179,chapas7a8:227,threeAxle:233,trailer:267},
  {destination:"Matosinhos",threeAxle:134,trailer:153},
  {destination:"Mealhada",chapas3x2:148,chapas4a6:187,chapas7a8:218,threeAxle:218,trailer:253},
  {destination:"Mértola",chapas3x2:354,chapas4a6:533,chapas7a8:639},
  {destination:"Minde",threeAxle:354,trailer:445},
  {destination:"Mindelo",threeAxle:140,trailer:168},
  {destination:"Miranda do Corvo",chapas3x2:148,chapas4a6:201,chapas7a8:267},
  {destination:"Mogadouro",chapas3x2:301,chapas4a6:433,chapas7a8:566},
  {destination:"Moimenta da Beira",chapas3x2:267,chapas4a6:332,chapas7a8:433,threeAxle:433,trailer:499},
  {destination:"Monção",chapas4a6:267,threeAxle:332,trailer:399},
  {destination:"Montalegre",chapas3x2:329,threeAxle:386,trailer:466},
  {destination:"Montemor-o-Novo",chapas3x2:301,chapas4a6:365,chapas7a8:566,threeAxle:566,trailer:599},
  {destination:"Mortágua",threeAxle:306,trailer:372},
  {destination:"Moura",threeAxle:666,trailer:772},
  {destination:"Nazaré",trailer:380},
  {destination:"Nelas",chapas3x2:240,chapas4a6:267,chapas7a8:332,threeAxle:332,trailer:372},
  {destination:"Nogueira do Cravo",threeAxle:179,trailer:213},
  {destination:"Oiã",chapas3x2:134,chapas4a6:187,chapas7a8:227,threeAxle:227,trailer:253},
  {destination:"Oleiros",chapas3x2:201,chapas4a6:267,chapas7a8:332},
  {destination:"Oliveira Bairro",threeAxle:218,trailer:253},
  {destination:"Oliveira de Azeméis",chapas3x2:128,chapas4a6:168,chapas7a8:192,threeAxle:192,trailer:213},
  {destination:"Oliveira de Frades",chapas2x1:149,chapas3x2:168,chapas4a6:201,chapas7a8:247,threeAxle:247,trailer:301},
  {destination:"Oliveira do Bairro",chapas3x2:148,chapas4a6:187,chapas7a8:218,threeAxle:227,trailer:253},
  {destination:"Oliveira do Hospital",chapas3x2:201,chapas4a6:280,chapas7a8:332},
  {destination:"Ourém",chapas2x1:119,chapas3x2:179,chapas4a6:198,threeAxle:280,trailer:332},
  {destination:"Ourique",chapas3x2:365,chapas4a6:533,chapas7a8:631},
  {destination:"Ovar",chapas3x2:100,chapas4a6:128,chapas7a8:148,threeAxle:179,trailer:213},
  {destination:"Paços Brandão",threeAxle:174,trailer:201},
  {destination:"Paços de Ferreira",chapas3x2:128,chapas4a6:168,chapas7a8:192,threeAxle:192,trailer:213},
  {destination:"Paredes",chapas3x2:128,chapas4a6:168,chapas7a8:192,threeAxle:192,trailer:213},
  {destination:"Paredes de Coura",chapas3x2:187,chapas4a6:201,chapas7a8:240,threeAxle:253,trailer:301},
  {destination:"Pedrogão Grande",chapas3x2:161},
  {destination:"Penacova",chapas3x2:148,chapas4a6:201,chapas7a8:267,threeAxle:267,trailer:313},
  {destination:"Penafiel",chapas3x2:159,chapas4a6:174,chapas7a8:187,threeAxle:192,trailer:233},
  {destination:"Penela",chapas3x2:148,chapas4a6:201,chapas7a8:267},
  {destination:"Peniche",threeAxle:347,trailer:433},
  {destination:"Pindelo",chapas3x2:128,chapas4a6:168,chapas7a8:192,threeAxle:192,trailer:213},
  {destination:"Pinhel",chapas3x2:267,chapas4a6:332,chapas7a8:399},
  {destination:"Ponte de Lima",chapas3x2:187,chapas4a6:218,chapas7a8:233,threeAxle:247,trailer:286},
  {destination:"Ponte de Sôr",chapas3x2:168,chapas4a6:233,chapas7a8:332},
  {destination:"Portalegre",chapas3x2:301,chapas4a6:365,chapas7a8:566,threeAxle:566,trailer:626},
  {destination:"Portel",chapas3x2:267,chapas4a6:332,chapas7a8:499},
  {destination:"Porto",chapas3x2:78,chapas4a6:100,chapas7a8:128,threeAxle:134,trailer:134},
  {destination:"Póvoa de Lanhoso",chapas7a8:227,threeAxle:233,trailer:267},
  {destination:"Póvoa do Varzim",chapas3x2:113,chapas4a6:140,chapas7a8:159,threeAxle:159,trailer:168},
  {destination:"Proença-a-Nova",chapas3x2:201,chapas4a6:267,chapas7a8:332},
  {destination:"Reguengos de Monsaraz",chapas3x2:332,chapas4a6:399,chapas7a8:533},
  {destination:"Resende",chapas4a6:253,threeAxle:267,trailer:313},
  {destination:"Ribeira de Pena",chapas3x2:233,chapas4a6:301,chapas7a8:365,threeAxle:365,trailer:458},
  {destination:"Rio Maior",chapas3x2:148,chapas4a6:213,chapas7a8:301},
  {destination:"Rio Tinto",chapas3x2:100,chapas4a6:128,chapas7a8:134},
  {destination:"Sabugal",chapas3x2:267,chapas4a6:332,chapas7a8:433},
  {destination:"Sangalhos",chapas3x2:148,chapas4a6:187,chapas7a8:218,threeAxle:218,trailer:253},
  {destination:"Santa Maria Arnoso",threeAxle:168,trailer:201},
  {destination:"Santa Maria de Lamas",chapas3x2:100,chapas4a6:128,chapas7a8:134,threeAxle:174,trailer:201},
  {destination:"Santiago do Cacém",chapas2x1:256,chapas3x2:301,chapas4a6:466,chapas7a8:599,threeAxle:620,trailer:731},
  {destination:"Santiago Maior",chapas3x2:267,chapas4a6:332,chapas7a8:533},
  {destination:"Santo Tirso",chapas3x2:113,chapas4a6:140,chapas7a8:159,threeAxle:168,trailer:201},
  {destination:"São Cosme do Vale",threeAxle:168,trailer:201},
  {destination:"São João da Madeira",threeAxle:179,trailer:213},
  {destination:"São João de Ver",threeAxle:174,trailer:201},
  {destination:"São Paio de Oleiros",threeAxle:134,trailer:153},
  {destination:"São Pedro do Sul",chapas3x2:240,chapas4a6:267,chapas7a8:306,threeAxle:306,trailer:372},
  {destination:"Seia",chapas2x1:179,chapas3x2:213,chapas4a6:301,chapas7a8:365},
  {destination:"Seiça",threeAxle:280,trailer:332},
  {destination:"Sernancelhe",chapas3x2:267,chapas4a6:332,chapas7a8:433},
  {destination:"Serpa",chapas3x2:267,chapas4a6:332,chapas7a8:533},
  {destination:"Sertã",chapas3x2:201,chapas4a6:267,chapas7a8:332},
  {destination:"Sever do Vouga",chapas3x2:134,chapas4a6:168,chapas7a8:201,threeAxle:201,trailer:227},
  {destination:"Silves",chapas2x1:267,chapas3x2:399,chapas4a6:599,chapas7a8:697,threeAxle:800,trailer:931},
  {destination:"Sines",chapas3x2:301,chapas4a6:466,chapas7a8:599,threeAxle:620,trailer:731},
  {destination:"Tábua",chapas3x2:240,chapas4a6:267,chapas7a8:332,threeAxle:332,trailer:372},
  {destination:"Taveiro",chapas2x1:134,chapas3x2:148,chapas4a6:192,chapas7a8:240,threeAxle:253,trailer:301},
  {destination:"Tomar",chapas3x2:148,chapas4a6:213,chapas7a8:301,threeAxle:354,trailer:445},
  {destination:"Tondela",chapas3x2:240,chapas4a6:267,chapas7a8:332},
  {destination:"Torre de Moncorvo",chapas3x2:267,chapas4a6:332,chapas7a8:433,threeAxle:433,trailer:499},
  {destination:"Tortosendo",chapas3x2:267,chapas4a6:332,chapas7a8:399,threeAxle:466,trailer:560},
  {destination:"Trofa",chapas3x2:113,chapas4a6:134,chapas7a8:140,threeAxle:140,trailer:168},
  {destination:"V.N.S.André",chapas2x1:256,chapas3x2:301,chapas4a6:466,chapas7a8:599,threeAxle:620,trailer:731},
  {destination:"Vagos",chapas3x2:134,chapas4a6:168,chapas7a8:201,threeAxle:201,trailer:227},
  {destination:"Vale de Cambra",chapas3x2:134,chapas4a6:159,chapas7a8:187,threeAxle:187,trailer:233},
  {destination:"Valongo / Ermesinde",chapas3x2:100,chapas4a6:128,chapas7a8:176,threeAxle:179,trailer:213},
  {destination:"Valougo do Vouga",threeAxle:179,trailer:227},
  {destination:"Vendas Novas",threeAxle:414,trailer:514},
  {destination:"Viana do Castelo",chapas3x2:187,chapas4a6:218,chapas7a8:233,threeAxle:233,trailer:267},
  {destination:"Vieira do Minho",chapas3x2:201,chapas4a6:233,threeAxle:260,trailer:280},
  {destination:"Vila de Rei",chapas3x2:201,chapas4a6:267,chapas7a8:335},
  {destination:"Vila do Conde",chapas3x2:108,chapas4a6:134,chapas7a8:140,threeAxle:140,trailer:168},
  {destination:"Vila Flor",chapas3x2:267,chapas4a6:332,chapas7a8:433,threeAxle:433,trailer:499},
  {destination:"Vila Meã",chapas3x2:187,chapas4a6:213,chapas7a8:233,threeAxle:233,trailer:267},
  {destination:"Vila Nova de Cerveira",chapas3x2:201,chapas4a6:233,threeAxle:267,trailer:313},
  {destination:"Vila Nova de Famalicão",chapas3x2:113,chapas4a6:140,chapas7a8:159,threeAxle:168,trailer:201},
  {destination:"Vila Nova de Gaia",threeAxle:134,trailer:153},
  {destination:"Vila Real",chapas3x2:201,chapas4a6:253,chapas7a8:267,threeAxle:267,trailer:313},
  {destination:"Vila Verde",chapas3x2:187,chapas4a6:218,chapas7a8:233,threeAxle:233,trailer:267},
  {destination:"Vilamoura",threeAxle:800,trailer:931},
  {destination:"Vilar de Mouros",chapas3x2:187,chapas4a6:201,chapas7a8:240,threeAxle:253,trailer:301},
  {destination:"Vilarinho do Bairro",chapas3x2:148,chapas4a6:187,chapas7a8:218,threeAxle:218,trailer:253},
  {destination:"Viseu",chapas2x1:198,chapas3x2:240,chapas4a6:267,chapas7a8:306,threeAxle:306,trailer:372},
  {destination:"Zona Centro (Leiria, Benedita, Fátima)",chapas2x1:108,chapas3x2:134,chapas4a6:201,chapas7a8:267,threeAxle:267,trailer:326},
  {destination:"Zona de Lisboa",chapas2x1:134,chapas3x2:148,chapas4a6:213,chapas7a8:301,threeAxle:354,trailer:445},
];

// Internal transfer costs (Reboque)
export const transferCosts = [
  { from: "Gulpilhares", to: "Meirinhas", cost: 225 },
  { from: "Maia", to: "Meirinhas", cost: 225 },
  { from: "Gulpilhares", to: "Maia", cost: 103 },
];

// Delivery cost per internal delivery
export const deliveryCostPerEntry = 25;

// Construction dimension types
export interface DimensionType {
  label: string;
  meters: number;
  ccField: keyof CCPriceEntry;
}

export const dimensionTypes: DimensionType[] = [
  { label: "Chapas 2×1.05m", meters: 1.05, ccField: "chapas2x1" },
  { label: "Chapas 3×2m", meters: 2, ccField: "chapas3x2" },
  { label: "Chapas 4 a 6m", meters: 6, ccField: "chapas4a6" },
  { label: "Chapas 7 a 8m", meters: 8, ccField: "chapas7a8" },
];

// Keep legacy exports for backward compatibility
export const genericWeightPrices: { kgUpTo: number; cost: number }[] =
  cfZones.find(z => z.zoneId === 8)?.prices ?? [];

// Simplified locations list (all unique destinations from CF + CC)
export const locations = (() => {
  const allDests = new Set<string>();
  cfZones.forEach(z => z.destinations.forEach(d => allDests.add(d)));
  ccPrices.forEach(p => allDests.add(p.destination));
  return [...allDests].sort().map((name, i) => ({ id: i + 1, name }));
})();

// Origins for the simulator
export const origins = [
  { id: 1, name: "Gulpilhares/Espinho" },
  { id: 2, name: "Meirinhas" },
  { id: 3, name: "Maia" },
];

// Legacy: pombalensePricesByWeight kept for reference but cfZones is now the primary source
export const pombalensePricesByWeight: PombalensePriceEntry[] = [];

export const metroCostBase = 332;
export const metroDeliveryCost = 25;
