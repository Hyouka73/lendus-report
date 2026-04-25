import fs from 'fs';
import { randomUUID } from 'crypto';

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

// Ponderación de estados (CDMX, Edomex, Jalisco y Nuevo León tienen más peso)
const ESTADO_WEIGHTS = ESTADOS_MEXICO.map(estado => {
  if (['Ciudad de México', 'México'].includes(estado)) return 15;
  if (['Jalisco', 'Nuevo León', 'Veracruz'].includes(estado)) return 8;
  if (['Puebla', 'Guanajuato', 'Baja California'].includes(estado)) return 5;
  return 2;
});

const weightedRandom = (options, weights) => {
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < options.length; i++) {
    if (random < weights[i]) return options[i];
    random -= weights[i];
  }
  return options[options.length - 1];
};

export const generarLoteDatos = (cantidad) => {
  const datos = [];
  const estatusOptions = ['Pagado', 'Moroso', 'Activo', 'En Revisión'];
  const estatusWeights = [25, 10, 55, 10]; // Mayoría activos

  const productoOptions = ['Personal', 'Nómina', 'Automotriz', 'Hipotecario', 'PyME'];
  const productoWeights = [40, 25, 15, 5, 15]; // Personal y Nómina son los más comunes

  const generoOptions = ['M', 'F', 'X'];
  const generoWeights = [48, 48, 4];

  for (let i = 0; i < cantidad; i++) {
    const producto = weightedRandom(productoOptions, productoWeights);
    
    // Correlación de montos por producto
    let minMonto = 5000;
    let maxMonto = 50000;
    let avgTasa = 25;

    switch(producto) {
      case 'Personal': minMonto = 5000; maxMonto = 80000; avgTasa = 35; break;
      case 'Nómina': minMonto = 10000; maxMonto = 150000; avgTasa = 22; break;
      case 'Automotriz': minMonto = 150000; maxMonto = 600000; avgTasa = 16; break;
      case 'Hipotecario': minMonto = 800000; maxMonto = 4000000; avgTasa = 11; break;
      case 'PyME': minMonto = 100000; maxMonto = 2000000; avgTasa = 18; break;
    }

    const monto = Math.floor(Math.random() * (maxMonto - minMonto)) + minMonto;
    const estatus = weightedRandom(estatusOptions, estatusWeights);
    const estado = weightedRandom(ESTADOS_MEXICO, ESTADO_WEIGHTS);

    datos.push({
      id: randomUUID(),
      nombre: `Usuario Falso ${i + 1}`,
      rfc: `XAXX010101${i.toString().slice(-3)}`, // RFC Genérico
      curp: `CURP${i.toString().padStart(14, '0')}`,
      estado,
      monto_credito: monto,
      saldo_pendiente: estatus === 'Pagado' ? 0 : Math.floor(Math.random() * monto * 0.9),
      estatus,
      producto,
      genero: weightedRandom(generoOptions, generoWeights),
      edad: producto === 'Hipotecario' || producto === 'PyME' 
            ? Math.floor(Math.random() * 35) + 30 // Más adultos para hipotecas/PyME
            : Math.floor(Math.random() * 45) + 18,
      tasa_interes: Math.max(5, avgTasa + (Math.random() * 10 - 5)),
      // Sesgo temporal: más registros recientes
      fecha_registro: new Date(2023, Math.floor(Math.pow(Math.random(), 0.5) * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  }
  return datos;
};

const datos = generarLoteDatos(100000);
fs.writeFileSync('public/data.json', JSON.stringify(datos));
console.log('✅ 100,000 registros generados con distribución realista en public/data.json');
