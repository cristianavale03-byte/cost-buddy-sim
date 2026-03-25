// Fleet cost data extracted from AGI Excel model

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

// Pombalense price table by weight - grouped by origin-dest pair
export const pombalensePricesByWeight: PombalensePriceEntry[] = [
  // Origin 1, Dest 1
  {kgUpTo:510,cost:80,originId:1,destId:1},{kgUpTo:765,cost:101,originId:1,destId:1},{kgUpTo:1020,cost:121,originId:1,destId:1},
  {kgUpTo:1275,cost:141,originId:1,destId:1},{kgUpTo:1530,cost:161,originId:1,destId:1},{kgUpTo:1785,cost:183,originId:1,destId:1},
  {kgUpTo:2040,cost:204,originId:1,destId:1},{kgUpTo:2550,cost:223,originId:1,destId:1},{kgUpTo:3500,cost:228,originId:1,destId:1},
  {kgUpTo:4500,cost:252,originId:1,destId:1},{kgUpTo:5700,cost:277,originId:1,destId:1},{kgUpTo:6500,cost:288,originId:1,destId:1},
  {kgUpTo:7500,cost:296,originId:1,destId:1},{kgUpTo:15000,cost:399,originId:1,destId:1},{kgUpTo:25000,cost:485,originId:1,destId:1},
  // Origin 1, Dest 2
  {kgUpTo:250,cost:26,originId:1,destId:2},{kgUpTo:300,cost:28,originId:1,destId:2},{kgUpTo:350,cost:32,originId:1,destId:2},
  {kgUpTo:400,cost:35,originId:1,destId:2},{kgUpTo:450,cost:37,originId:1,destId:2},{kgUpTo:500,cost:40,originId:1,destId:2},
  {kgUpTo:600,cost:46,originId:1,destId:2},{kgUpTo:700,cost:51,originId:1,destId:2},{kgUpTo:800,cost:56,originId:1,destId:2},
  {kgUpTo:900,cost:60,originId:1,destId:2},{kgUpTo:1000,cost:64,originId:1,destId:2},{kgUpTo:1100,cost:69,originId:1,destId:2},
  {kgUpTo:1200,cost:72,originId:1,destId:2},{kgUpTo:1300,cost:76,originId:1,destId:2},{kgUpTo:1400,cost:80,originId:1,destId:2},
  {kgUpTo:1500,cost:84,originId:1,destId:2},{kgUpTo:1600,cost:89,originId:1,destId:2},{kgUpTo:1700,cost:94,originId:1,destId:2},
  {kgUpTo:1800,cost:98,originId:1,destId:2},{kgUpTo:1900,cost:101,originId:1,destId:2},{kgUpTo:2000,cost:107,originId:1,destId:2},
  {kgUpTo:2200,cost:114,originId:1,destId:2},{kgUpTo:2400,cost:121,originId:1,destId:2},{kgUpTo:2600,cost:132,originId:1,destId:2},
  {kgUpTo:2800,cost:139,originId:1,destId:2},{kgUpTo:3000,cost:149,originId:1,destId:2},{kgUpTo:3300,cost:152,originId:1,destId:2},
  {kgUpTo:3600,cost:155,originId:1,destId:2},{kgUpTo:3900,cost:159,originId:1,destId:2},{kgUpTo:4200,cost:165,originId:1,destId:2},
  {kgUpTo:4500,cost:171,originId:1,destId:2},{kgUpTo:4800,cost:174,originId:1,destId:2},{kgUpTo:5100,cost:177,originId:1,destId:2},
  {kgUpTo:5400,cost:181,originId:1,destId:2},{kgUpTo:5800,cost:185,originId:1,destId:2},{kgUpTo:6200,cost:188,originId:1,destId:2},
  {kgUpTo:6600,cost:190,originId:1,destId:2},{kgUpTo:7000,cost:196,originId:1,destId:2},{kgUpTo:7500,cost:199,originId:1,destId:2},
  {kgUpTo:8000,cost:201,originId:1,destId:2},{kgUpTo:8500,cost:204,originId:1,destId:2},{kgUpTo:9000,cost:206,originId:1,destId:2},
  {kgUpTo:9500,cost:209,originId:1,destId:2},{kgUpTo:10000,cost:211,originId:1,destId:2},{kgUpTo:15000,cost:267,originId:1,destId:2},
  {kgUpTo:25000,cost:326,originId:1,destId:2},
  // Origin 1, Dest 3
  {kgUpTo:250,cost:130,originId:1,destId:3},{kgUpTo:300,cost:137,originId:1,destId:3},{kgUpTo:350,cost:145,originId:1,destId:3},
  {kgUpTo:400,cost:150,originId:1,destId:3},{kgUpTo:450,cost:155,originId:1,destId:3},{kgUpTo:500,cost:164,originId:1,destId:3},
  {kgUpTo:600,cost:170,originId:1,destId:3},{kgUpTo:700,cost:176,originId:1,destId:3},{kgUpTo:800,cost:182,originId:1,destId:3},
  {kgUpTo:900,cost:190,originId:1,destId:3},{kgUpTo:1000,cost:195,originId:1,destId:3},{kgUpTo:1100,cost:200,originId:1,destId:3},
  {kgUpTo:1200,cost:205,originId:1,destId:3},{kgUpTo:1300,cost:209,originId:1,destId:3},{kgUpTo:1400,cost:216,originId:1,destId:3},
  {kgUpTo:1500,cost:221,originId:1,destId:3},{kgUpTo:1600,cost:226,originId:1,destId:3},{kgUpTo:1700,cost:231,originId:1,destId:3},
  {kgUpTo:1800,cost:236,originId:1,destId:3},{kgUpTo:1900,cost:242,originId:1,destId:3},{kgUpTo:2000,cost:246,originId:1,destId:3},
  {kgUpTo:2200,cost:253,originId:1,destId:3},{kgUpTo:2400,cost:260,originId:1,destId:3},{kgUpTo:2600,cost:265,originId:1,destId:3},
  {kgUpTo:2800,cost:270,originId:1,destId:3},{kgUpTo:3000,cost:276,originId:1,destId:3},{kgUpTo:3300,cost:281,originId:1,destId:3},
  {kgUpTo:3600,cost:286,originId:1,destId:3},{kgUpTo:3900,cost:291,originId:1,destId:3},{kgUpTo:4200,cost:296,originId:1,destId:3},
  {kgUpTo:4500,cost:303,originId:1,destId:3},{kgUpTo:4800,cost:308,originId:1,destId:3},{kgUpTo:5100,cost:312,originId:1,destId:3},
  {kgUpTo:5400,cost:316,originId:1,destId:3},{kgUpTo:5800,cost:320,originId:1,destId:3},{kgUpTo:6200,cost:323,originId:1,destId:3},
  {kgUpTo:6600,cost:327,originId:1,destId:3},{kgUpTo:7000,cost:331,originId:1,destId:3},{kgUpTo:7500,cost:337,originId:1,destId:3},
  {kgUpTo:8000,cost:340,originId:1,destId:3},{kgUpTo:8500,cost:343,originId:1,destId:3},{kgUpTo:9000,cost:349,originId:1,destId:3},
  {kgUpTo:9500,cost:353,originId:1,destId:3},{kgUpTo:10000,cost:357,originId:1,destId:3},
  // Origin 1, Dest 4
  {kgUpTo:250,cost:122,originId:1,destId:4},{kgUpTo:300,cost:129,originId:1,destId:4},{kgUpTo:350,cost:132,originId:1,destId:4},
  {kgUpTo:400,cost:136,originId:1,destId:4},{kgUpTo:450,cost:138,originId:1,destId:4},{kgUpTo:500,cost:140,originId:1,destId:4},
  {kgUpTo:600,cost:146,originId:1,destId:4},{kgUpTo:700,cost:151,originId:1,destId:4},{kgUpTo:800,cost:154,originId:1,destId:4},
  {kgUpTo:900,cost:157,originId:1,destId:4},{kgUpTo:1000,cost:161,originId:1,destId:4},{kgUpTo:1100,cost:169,originId:1,destId:4},
  {kgUpTo:1200,cost:173,originId:1,destId:4},{kgUpTo:1300,cost:176,originId:1,destId:4},{kgUpTo:1400,cost:179,originId:1,destId:4},
  {kgUpTo:1500,cost:185,originId:1,destId:4},{kgUpTo:1600,cost:188,originId:1,destId:4},{kgUpTo:1700,cost:191,originId:1,destId:4},
  {kgUpTo:1800,cost:197,originId:1,destId:4},{kgUpTo:1900,cost:203,originId:1,destId:4},{kgUpTo:2000,cost:206,originId:1,destId:4},
  {kgUpTo:2200,cost:239,originId:1,destId:4},{kgUpTo:2400,cost:247,originId:1,destId:4},{kgUpTo:2600,cost:256,originId:1,destId:4},
  {kgUpTo:2800,cost:264,originId:1,destId:4},{kgUpTo:3000,cost:271,originId:1,destId:4},{kgUpTo:3300,cost:277,originId:1,destId:4},
  {kgUpTo:3600,cost:281,originId:1,destId:4},{kgUpTo:3900,cost:284,originId:1,destId:4},{kgUpTo:4200,cost:290,originId:1,destId:4},
  {kgUpTo:4500,cost:293,originId:1,destId:4},{kgUpTo:4800,cost:296,originId:1,destId:4},{kgUpTo:5100,cost:302,originId:1,destId:4},
  {kgUpTo:5400,cost:305,originId:1,destId:4},{kgUpTo:5800,cost:310,originId:1,destId:4},{kgUpTo:6200,cost:313,originId:1,destId:4},
  {kgUpTo:6600,cost:316,originId:1,destId:4},{kgUpTo:7000,cost:320,originId:1,destId:4},{kgUpTo:7500,cost:322,originId:1,destId:4},
  {kgUpTo:8000,cost:325,originId:1,destId:4},{kgUpTo:8500,cost:327,originId:1,destId:4},{kgUpTo:9000,cost:330,originId:1,destId:4},
  {kgUpTo:9500,cost:332,originId:1,destId:4},{kgUpTo:10000,cost:335,originId:1,destId:4},{kgUpTo:15000,cost:466,originId:1,destId:4},
  {kgUpTo:25000,cost:560,originId:1,destId:4},
  // Origin 1, Dest 5
  {kgUpTo:400,cost:39,originId:1,destId:5},{kgUpTo:450,cost:42,originId:1,destId:5},{kgUpTo:500,cost:45,originId:1,destId:5},
  {kgUpTo:600,cost:50,originId:1,destId:5},{kgUpTo:700,cost:57,originId:1,destId:5},{kgUpTo:800,cost:60,originId:1,destId:5},
  {kgUpTo:900,cost:67,originId:1,destId:5},{kgUpTo:1000,cost:71,originId:1,destId:5},{kgUpTo:1100,cost:76,originId:1,destId:5},
  {kgUpTo:1200,cost:79,originId:1,destId:5},{kgUpTo:1300,cost:83,originId:1,destId:5},{kgUpTo:1400,cost:89,originId:1,destId:5},
  {kgUpTo:1500,cost:94,originId:1,destId:5},{kgUpTo:1600,cost:98,originId:1,destId:5},{kgUpTo:1700,cost:103,originId:1,destId:5},
  {kgUpTo:1800,cost:108,originId:1,destId:5},{kgUpTo:1900,cost:112,originId:1,destId:5},{kgUpTo:2000,cost:115,originId:1,destId:5},
  {kgUpTo:2200,cost:126,originId:1,destId:5},{kgUpTo:2400,cost:136,originId:1,destId:5},{kgUpTo:2600,cost:146,originId:1,destId:5},
  {kgUpTo:2800,cost:149,originId:1,destId:5},{kgUpTo:3000,cost:156,originId:1,destId:5},{kgUpTo:3300,cost:161,originId:1,destId:5},
  {kgUpTo:3600,cost:168,originId:1,destId:5},{kgUpTo:3900,cost:173,originId:1,destId:5},{kgUpTo:4200,cost:176,originId:1,destId:5},
  {kgUpTo:4500,cost:180,originId:1,destId:5},{kgUpTo:4800,cost:185,originId:1,destId:5},{kgUpTo:5100,cost:189,originId:1,destId:5},
  {kgUpTo:5400,cost:192,originId:1,destId:5},{kgUpTo:5800,cost:198,originId:1,destId:5},{kgUpTo:6200,cost:203,originId:1,destId:5},
  {kgUpTo:6600,cost:205,originId:1,destId:5},{kgUpTo:7000,cost:209,originId:1,destId:5},{kgUpTo:7500,cost:212,originId:1,destId:5},
  {kgUpTo:8000,cost:213,originId:1,destId:5},{kgUpTo:8500,cost:215,originId:1,destId:5},{kgUpTo:9000,cost:217,originId:1,destId:5},
  {kgUpTo:9500,cost:222,originId:1,destId:5},{kgUpTo:10000,cost:226,originId:1,destId:5},{kgUpTo:15000,cost:466,originId:1,destId:5},
  {kgUpTo:25000,cost:560,originId:1,destId:5},
  // Origin 1, Dest 6
  {kgUpTo:400,cost:129,originId:1,destId:6},{kgUpTo:450,cost:134,originId:1,destId:6},{kgUpTo:500,cost:141,originId:1,destId:6},
  {kgUpTo:600,cost:149,originId:1,destId:6},{kgUpTo:700,cost:154,originId:1,destId:6},{kgUpTo:800,cost:160,originId:1,destId:6},
  {kgUpTo:900,cost:169,originId:1,destId:6},{kgUpTo:1000,cost:175,originId:1,destId:6},{kgUpTo:1100,cost:181,originId:1,destId:6},
  {kgUpTo:1200,cost:188,originId:1,destId:6},{kgUpTo:1300,cost:196,originId:1,destId:6},{kgUpTo:1400,cost:203,originId:1,destId:6},
  {kgUpTo:1500,cost:209,originId:1,destId:6},{kgUpTo:1600,cost:213,originId:1,destId:6},{kgUpTo:1700,cost:218,originId:1,destId:6},
  {kgUpTo:1800,cost:226,originId:1,destId:6},{kgUpTo:1900,cost:231,originId:1,destId:6},{kgUpTo:2000,cost:235,originId:1,destId:6},
  {kgUpTo:2200,cost:240,originId:1,destId:6},{kgUpTo:2400,cost:245,originId:1,destId:6},{kgUpTo:2600,cost:251,originId:1,destId:6},
  {kgUpTo:2800,cost:256,originId:1,destId:6},{kgUpTo:3000,cost:262,originId:1,destId:6},{kgUpTo:3300,cost:268,originId:1,destId:6},
  {kgUpTo:3600,cost:271,originId:1,destId:6},{kgUpTo:3900,cost:276,originId:1,destId:6},{kgUpTo:4200,cost:280,originId:1,destId:6},
  {kgUpTo:4500,cost:283,originId:1,destId:6},{kgUpTo:4800,cost:287,originId:1,destId:6},{kgUpTo:5100,cost:291,originId:1,destId:6},
  {kgUpTo:5400,cost:294,originId:1,destId:6},{kgUpTo:5800,cost:301,originId:1,destId:6},{kgUpTo:6200,cost:304,originId:1,destId:6},
  {kgUpTo:6600,cost:308,originId:1,destId:6},{kgUpTo:7000,cost:312,originId:1,destId:6},{kgUpTo:7500,cost:316,originId:1,destId:6},
  {kgUpTo:8000,cost:320,originId:1,destId:6},{kgUpTo:8500,cost:323,originId:1,destId:6},{kgUpTo:9000,cost:327,originId:1,destId:6},
  {kgUpTo:9500,cost:331,originId:1,destId:6},{kgUpTo:10000,cost:337,originId:1,destId:6},{kgUpTo:15000,cost:566,originId:1,destId:6},
  {kgUpTo:25000,cost:626,originId:1,destId:6},
  // Origin 1, Dest 7 (local/short)
  {kgUpTo:500,cost:21,originId:1,destId:7},{kgUpTo:600,cost:21,originId:1,destId:7},{kgUpTo:700,cost:23,originId:1,destId:7},
  {kgUpTo:800,cost:24,originId:1,destId:7},{kgUpTo:900,cost:26,originId:1,destId:7},{kgUpTo:1000,cost:27,originId:1,destId:7},
  {kgUpTo:1100,cost:30,originId:1,destId:7},{kgUpTo:1200,cost:31,originId:1,destId:7},{kgUpTo:1300,cost:33,originId:1,destId:7},
  {kgUpTo:1400,cost:34,originId:1,destId:7},{kgUpTo:1500,cost:36,originId:1,destId:7},{kgUpTo:1600,cost:38,originId:1,destId:7},
  {kgUpTo:1700,cost:39,originId:1,destId:7},{kgUpTo:1800,cost:42,originId:1,destId:7},{kgUpTo:1900,cost:44,originId:1,destId:7},
  {kgUpTo:2000,cost:47,originId:1,destId:7},{kgUpTo:2200,cost:50,originId:1,destId:7},{kgUpTo:2400,cost:53,originId:1,destId:7},
  {kgUpTo:2600,cost:56,originId:1,destId:7},{kgUpTo:2800,cost:59,originId:1,destId:7},{kgUpTo:3000,cost:66,originId:1,destId:7},
  {kgUpTo:3300,cost:67,originId:1,destId:7},{kgUpTo:3600,cost:70,originId:1,destId:7},{kgUpTo:3900,cost:71,originId:1,destId:7},
  {kgUpTo:4200,cost:73,originId:1,destId:7},{kgUpTo:4500,cost:74,originId:1,destId:7},{kgUpTo:4800,cost:77,originId:1,destId:7},
  {kgUpTo:5100,cost:78,originId:1,destId:7},{kgUpTo:5400,cost:79,originId:1,destId:7},{kgUpTo:5800,cost:80,originId:1,destId:7},
  {kgUpTo:6200,cost:81,originId:1,destId:7},{kgUpTo:6600,cost:83,originId:1,destId:7},{kgUpTo:7000,cost:84,originId:1,destId:7},
  {kgUpTo:7500,cost:86,originId:1,destId:7},{kgUpTo:8000,cost:87,originId:1,destId:7},{kgUpTo:8500,cost:89,originId:1,destId:7},
  {kgUpTo:9000,cost:90,originId:1,destId:7},{kgUpTo:9500,cost:93,originId:1,destId:7},{kgUpTo:10000,cost:94,originId:1,destId:7},
  {kgUpTo:15000,cost:179,originId:1,destId:7},{kgUpTo:25000,cost:213,originId:1,destId:7},
  // Origin 1, Dest 8 (main route used in model example)
  {kgUpTo:500,cost:32,originId:1,destId:8},{kgUpTo:600,cost:35,originId:1,destId:8},{kgUpTo:700,cost:39,originId:1,destId:8},
  {kgUpTo:800,cost:42,originId:1,destId:8},{kgUpTo:900,cost:46,originId:1,destId:8},{kgUpTo:1000,cost:50,originId:1,destId:8},
  {kgUpTo:1100,cost:53,originId:1,destId:8},{kgUpTo:1200,cost:57,originId:1,destId:8},{kgUpTo:1300,cost:59,originId:1,destId:8},
  {kgUpTo:1400,cost:63,originId:1,destId:8},{kgUpTo:1500,cost:66,originId:1,destId:8},{kgUpTo:1600,cost:70,originId:1,destId:8},
  {kgUpTo:1700,cost:72,originId:1,destId:8},{kgUpTo:1800,cost:76,originId:1,destId:8},{kgUpTo:1900,cost:78,originId:1,destId:8},
  {kgUpTo:2000,cost:81,originId:1,destId:8},{kgUpTo:2200,cost:87,originId:1,destId:8},{kgUpTo:2400,cost:96,originId:1,destId:8},
  {kgUpTo:2600,cost:101,originId:1,destId:8},{kgUpTo:2800,cost:109,originId:1,destId:8},{kgUpTo:3000,cost:114,originId:1,destId:8},
  {kgUpTo:3300,cost:117,originId:1,destId:8},{kgUpTo:3600,cost:120,originId:1,destId:8},{kgUpTo:3900,cost:122,originId:1,destId:8},
  {kgUpTo:4200,cost:129,originId:1,destId:8},{kgUpTo:4500,cost:131,originId:1,destId:8},{kgUpTo:4800,cost:134,originId:1,destId:8},
  {kgUpTo:5100,cost:137,originId:1,destId:8},{kgUpTo:5400,cost:139,originId:1,destId:8},{kgUpTo:5800,cost:141,originId:1,destId:8},
  {kgUpTo:6200,cost:146,originId:1,destId:8},{kgUpTo:6600,cost:149,originId:1,destId:8},{kgUpTo:7000,cost:151,originId:1,destId:8},
  {kgUpTo:7500,cost:152,originId:1,destId:8},{kgUpTo:8000,cost:154,originId:1,destId:8},{kgUpTo:8500,cost:155,originId:1,destId:8},
  {kgUpTo:9000,cost:157,originId:1,destId:8},{kgUpTo:9500,cost:160,originId:1,destId:8},{kgUpTo:10000,cost:161,originId:1,destId:8},
  {kgUpTo:15000,cost:134,originId:1,destId:8},{kgUpTo:25000,cost:153,originId:1,destId:8},
  // Origin 2, Dest 9
  {kgUpTo:400,cost:36,originId:2,destId:9},{kgUpTo:450,cost:39,originId:2,destId:9},{kgUpTo:500,cost:43,originId:2,destId:9},
  {kgUpTo:600,cost:48,originId:2,destId:9},{kgUpTo:700,cost:55,originId:2,destId:9},{kgUpTo:800,cost:58,originId:2,destId:9},
  {kgUpTo:900,cost:63,originId:2,destId:9},{kgUpTo:1000,cost:67,originId:2,destId:9},{kgUpTo:1100,cost:72,originId:2,destId:9},
  {kgUpTo:1200,cost:76,originId:2,destId:9},{kgUpTo:1300,cost:79,originId:2,destId:9},{kgUpTo:1400,cost:83,originId:2,destId:9},
  {kgUpTo:1500,cost:89,originId:2,destId:9},{kgUpTo:1600,cost:94,originId:2,destId:9},{kgUpTo:1700,cost:98,originId:2,destId:9},
  {kgUpTo:1800,cost:101,originId:2,destId:9},{kgUpTo:1900,cost:107,originId:2,destId:9},{kgUpTo:2000,cost:111,originId:2,destId:9},
  {kgUpTo:2200,cost:119,originId:2,destId:9},{kgUpTo:2400,cost:129,originId:2,destId:9},{kgUpTo:2600,cost:137,originId:2,destId:9},
  {kgUpTo:2800,cost:141,originId:2,destId:9},{kgUpTo:3000,cost:150,originId:2,destId:9},{kgUpTo:3300,cost:154,originId:2,destId:9},
  {kgUpTo:3600,cost:157,originId:2,destId:9},{kgUpTo:3900,cost:161,originId:2,destId:9},{kgUpTo:4200,cost:168,originId:2,destId:9},
  {kgUpTo:4500,cost:173,originId:2,destId:9},{kgUpTo:4800,cost:176,originId:2,destId:9},{kgUpTo:5100,cost:179,originId:2,destId:9},
  {kgUpTo:5400,cost:185,originId:2,destId:9},{kgUpTo:5800,cost:187,originId:2,destId:9},{kgUpTo:6200,cost:190,originId:2,destId:9},
  {kgUpTo:6600,cost:192,originId:2,destId:9},{kgUpTo:7000,cost:198,originId:2,destId:9},{kgUpTo:7500,cost:203,originId:2,destId:9},
  {kgUpTo:8000,cost:204,originId:2,destId:9},{kgUpTo:8500,cost:206,originId:2,destId:9},{kgUpTo:9000,cost:209,originId:2,destId:9},
  {kgUpTo:9500,cost:212,originId:2,destId:9},{kgUpTo:10000,cost:214,originId:2,destId:9},
];

// Simplified weight price lookup: use the generic table from Custos sheet
// This is the base price table used when no specific origin-dest pair is found
export const genericWeightPrices: { kgUpTo: number; cost: number }[] = [
  {kgUpTo:0,cost:17},{kgUpTo:500,cost:32},{kgUpTo:600,cost:35},{kgUpTo:700,cost:39},
  {kgUpTo:800,cost:42},{kgUpTo:900,cost:46},{kgUpTo:1000,cost:50},{kgUpTo:1100,cost:53},
  {kgUpTo:1200,cost:57},{kgUpTo:1300,cost:59},{kgUpTo:1400,cost:63},{kgUpTo:1500,cost:66},
  {kgUpTo:1600,cost:70},{kgUpTo:1700,cost:72},{kgUpTo:1800,cost:76},{kgUpTo:1900,cost:78},
  {kgUpTo:2000,cost:81},{kgUpTo:2200,cost:87},{kgUpTo:2400,cost:96},{kgUpTo:2600,cost:101},
  {kgUpTo:2800,cost:109},{kgUpTo:3000,cost:114},{kgUpTo:3300,cost:117},{kgUpTo:3600,cost:120},
  {kgUpTo:3900,cost:122},{kgUpTo:4200,cost:129},{kgUpTo:4500,cost:131},{kgUpTo:4800,cost:134},
  {kgUpTo:5100,cost:137},{kgUpTo:5400,cost:139},{kgUpTo:5800,cost:141},{kgUpTo:6200,cost:146},
  {kgUpTo:6600,cost:149},{kgUpTo:7000,cost:151},{kgUpTo:7500,cost:152},{kgUpTo:8000,cost:154},
  {kgUpTo:8500,cost:155},{kgUpTo:9000,cost:157},{kgUpTo:9500,cost:160},{kgUpTo:10000,cost:161},
  {kgUpTo:15000,cost:134},{kgUpTo:25000,cost:153},
];

// Delivery cost per internal delivery
export const deliveryCostPerEntry = 25;

// Locations with IDs and zones
export interface Location {
  id: number;
  name: string;
  zone: number;
}

export const locations: Location[] = [
  // Zone 1
  {id:1,name:"Carregal do Sal",zone:1},{id:2,name:"Castelo Branco",zone:1},{id:3,name:"Castro D'Aire",zone:1},
  {id:4,name:"Guarda",zone:1},{id:5,name:"Mortágua",zone:1},{id:6,name:"Nelas",zone:1},
  {id:7,name:"S. Comba Dão",zone:1},{id:8,name:"S.P.Sul",zone:1},{id:9,name:"Tondela",zone:1},{id:10,name:"Viseu",zone:1},
  // Zone 2
  {id:11,name:"Alcobaça",zone:2},{id:12,name:"Benedita",zone:2},{id:13,name:"Cantanhede",zone:2},
  {id:14,name:"Fátima",zone:2},{id:15,name:"Figueira da Foz",zone:2},{id:16,name:"Leiria",zone:2},
  {id:17,name:"Lousã",zone:2},{id:18,name:"Marinha Grande",zone:2},{id:19,name:"Mealhada",zone:2},
  {id:20,name:"Miranda do Corvo",zone:2},{id:21,name:"Oliveira de Frades",zone:2},{id:22,name:"Pombal",zone:2},
  {id:23,name:"Porto de Mós",zone:2},{id:24,name:"Santa Catarina da Serra",zone:2},{id:25,name:"Valado dos Frades",zone:2},
  // Zone 3
  {id:26,name:"Idanha-a-Nova",zone:3},
  // Zone 4
  {id:27,name:"Belmonte",zone:4},{id:28,name:"Covilhã",zone:4},{id:29,name:"Tortosendo",zone:4},
  // Zone 5
  {id:30,name:"Alcanena",zone:5},{id:31,name:"Alcoitão",zone:5},{id:32,name:"Alenquer",zone:5},
  {id:33,name:"Alverca",zone:5},{id:34,name:"Arcos de Valdevez",zone:5},{id:35,name:"Bombarral",zone:5},
  {id:36,name:"Caldas da Rainha",zone:5},{id:37,name:"Chamusca",zone:5},{id:38,name:"Constância",zone:5},
  {id:39,name:"Golegã",zone:5},{id:40,name:"Lisboa",zone:5},{id:41,name:"Lourinhã",zone:5},
  {id:42,name:"Mafra",zone:5},{id:43,name:"Monção",zone:5},{id:44,name:"Muge",zone:5},
  {id:45,name:"Óbidos",zone:5},{id:46,name:"Ourém/Caxarias",zone:5},{id:47,name:"Paredes de Coura",zone:5},
  {id:48,name:"Pedrogão Grande",zone:5},{id:49,name:"Peniche",zone:5},{id:50,name:"Sacavém",zone:5},
  {id:51,name:"São Mamede",zone:5},{id:52,name:"Sertã",zone:5},{id:53,name:"Sesimbra",zone:5},
  {id:54,name:"Setúbal",zone:5},{id:55,name:"Talaide",zone:5},{id:56,name:"Tomar",zone:5},
  {id:57,name:"Torres Novas",zone:5},{id:58,name:"Valença",zone:5},{id:59,name:"Vila Nova de Cerveira",zone:5},
  {id:60,name:"Vila Real",zone:5},
  // Zone 6
  {id:61,name:"Beja",zone:6},{id:62,name:"Cercal do Alentejo",zone:6},{id:63,name:"Évora",zone:6},
  {id:64,name:"Grandola",zone:6},{id:65,name:"Montemor-o-Novo",zone:6},{id:66,name:"Portalegre",zone:6},
  {id:67,name:"Vendas Novas",zone:6},{id:68,name:"Vila Viçosa",zone:6},
  // Zone 7
  {id:69,name:"Ermesinde",zone:7},{id:70,name:"Gaia",zone:7},{id:71,name:"Maia",zone:7},
  {id:72,name:"Porto",zone:7},{id:73,name:"São Mamede de Infesta",zone:7},{id:74,name:"São Romão do Coronado",zone:7},
  {id:75,name:"Valongo",zone:7},
  // Zone 8
  {id:76,name:"Argoncilhe",zone:8},{id:77,name:"Arouca",zone:8},{id:78,name:"Aveiro",zone:8},
  {id:79,name:"Braga",zone:8},{id:80,name:"Castelo de Paiva",zone:8},{id:81,name:"Escapães",zone:8},
  {id:82,name:"Esmoriz",zone:8},{id:83,name:"Espinho",zone:8},{id:84,name:"Esposende",zone:8},
  {id:85,name:"Estarreja",zone:8},{id:86,name:"Famalicão",zone:8},{id:87,name:"Felgueiras",zone:8},
  {id:88,name:"Grimancelos (Barcelos)",zone:8},{id:89,name:"Guimarães",zone:8},{id:90,name:"Lixa",zone:8},
  {id:91,name:"Lousada",zone:8},{id:92,name:"Milheiro de Poiares",zone:8},{id:93,name:"Oliveira de Azeméis",zone:8},
  {id:94,name:"Ovar",zone:8},{id:95,name:"Paços de Ferreira",zone:8},{id:96,name:"Paredes",zone:8},
  {id:97,name:"Penafiel",zone:8},{id:98,name:"Póvoa de Lanhoso",zone:8},{id:99,name:"Santo Tirso",zone:8},
  {id:100,name:"São João da Madeira",zone:8},{id:101,name:"São João de Ver",zone:8},{id:102,name:"Trofa",zone:8},
  {id:103,name:"Viana do Castelo",zone:8},{id:104,name:"Vila da Feira",zone:8},{id:105,name:"Vila do Conde",zone:8},
  {id:106,name:"Vila Meã",zone:8},
];

// Origins for the simulator
export const origins = [
  { id: 1, name: "Guilpilhares" },
  { id: 2, name: "Meirinhas" },
  { id: 3, name: "Maia" },
  { id: 4, name: "Espinho" },
];

// Construction dimension types
export interface DimensionType {
  label: string;
  meters: number;
}

export const dimensionTypes: DimensionType[] = [
  { label: "Chapas 2×1.05m", meters: 1.05 },
  { label: "Chapas 3×2m", meters: 2 },
  { label: "Chapas 4 a 6m", meters: 6 },
  { label: "Chapas 7 a 8m", meters: 8 },
];

// Metro price from model (Construção example)
export const metroCostBase = 332; // base cost per metro transport
export const metroDeliveryCost = 25; // per delivery
