/**
 * Seed demo master data for AwaniShop — Algerian kitchen / vaisselle market.
 *
 * Usage: npm run seed
 * Clears: categories, products, suppliers, lots (does not touch users/clients/orders/receptions).
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Lot = require('../models/Lot');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const LOTS = [
  { name: 'Magasin', code: 'MAG' },
  { name: 'Réserve', code: 'RES' },
];

/** Categories typical of a magasin d'articles de cuisine / vaisselle in Algeria */
const CATEGORIES = [
  { name: 'Verrerie', code: 'GLS' },
  { name: 'Couverts', code: 'CVT' },
  { name: 'Assiettes & Plats', code: 'ASS' },
  { name: 'Casseroles & Marmites', code: 'CAS' },
  { name: 'Poêles', code: 'POL' },
  { name: 'Thé & Café', code: 'THE' },
  { name: 'Ustensiles de cuisine', code: 'UST' },
  { name: 'Plastique ménage', code: 'PLS' },
  { name: 'Rangement', code: 'RNG' },
  { name: 'Électroménager léger', code: 'ELE' },
];

/**
 * Products keyed by category code.
 * Names match how DZ retailers label stock (FR + local usage).
 */
const PRODUCTS_BY_CATEGORY = {
  GLS: [
    { name: 'Verre à thé traditionnel 6 pcs', qrCode: '3059943011201' },
    { name: 'Verre à eau Luminarc 25 cl', qrCode: '3011261142104' },
    { name: 'Carafe en verre 1 L', qrCode: '3011261142203' },
    { name: 'Bol à salade en verre 23 cm', qrCode: '3011261142302' },
    { name: 'Plateau à gâteaux en verre', qrCode: '3011261142401' },
    { name: 'Tasse à café en verre avec anse', qrCode: '3011261142500' },
  ],
  CVT: [
    { name: 'Couverts inox 24 pcs (cuillères fourchettes)', qrCode: '8690001123401' },
    { name: 'Couteau de cuisine chef 20 cm', qrCode: '8690001123418' },
    { name: 'Couteau à pain dentelé', qrCode: '8690001123425' },
    { name: 'Cuillère à soupe inox x12', qrCode: '8690001123432' },
    { name: 'Fourchette à dessert x12', qrCode: '8690001123449' },
    { name: 'Ménagère 48 pcs coffret', qrCode: '8690001123456' },
  ],
  ASS: [
    { name: 'Assiette plate 27 cm blanche', qrCode: '8000123456701' },
    { name: 'Assiette creuse 22 cm', qrCode: '8000123456718' },
    { name: 'Assiette à dessert 19 cm', qrCode: '8000123456725' },
    { name: 'Plat de service ovale 35 cm', qrCode: '8000123456732' },
    { name: 'Saladier porcelaine 28 cm', qrCode: '8000123456749' },
    { name: 'Service assiettes 18 pcs', qrCode: '8000123456756' },
  ],
  CAS: [
    { name: 'Casserole inox 18 cm avec couvercle', qrCode: '3123456789012' },
    { name: 'Casserole inox 22 cm avec couvercle', qrCode: '3123456789029' },
    { name: 'Marmite couscoussier 8 L', qrCode: '3123456789036' },
    { name: 'Faitout émaillé 6 L', qrCode: '3123456789043' },
    { name: 'Tajine émaillé 32 cm', qrCode: '3123456789050' },
    { name: 'Autocuiseur 6 L', qrCode: '3123456789067' },
  ],
  POL: [
    { name: 'Poêle antiadhésive 24 cm', qrCode: '3168430123401' },
    { name: 'Poêle antiadhésive 28 cm', qrCode: '3168430123418' },
    { name: 'Poêle à crêpes 26 cm', qrCode: '3168430123425' },
    { name: 'Wok antiadhésif 30 cm', qrCode: '3168430123432' },
    { name: 'Grillade plaque antiadhésive', qrCode: '3168430123449' },
  ],
  THE: [
    { name: 'Théière inox 1,5 L', qrCode: '6901234567801' },
    { name: 'Théière en verre borosilicate 1 L', qrCode: '6901234567818' },
    { name: 'Plateau à thé en inox', qrCode: '6901234567825' },
    { name: 'Service à thé 6 verres + plateau', qrCode: '6901234567832' },
    { name: 'Cafetière italienne 6 tasses', qrCode: '6901234567849' },
    { name: 'Bouilloire électrique 1,7 L', qrCode: '6901234567856' },
  ],
  UST: [
    { name: 'Écumoire inox', qrCode: '4006381333901' },
    { name: 'Louche inox', qrCode: '4006381333918' },
    { name: 'Fouet de cuisine 30 cm', qrCode: '4006381333925' },
    { name: 'Planche à découper bois 40x25', qrCode: '4006381333932' },
    { name: 'Presse-ail inox', qrCode: '4006381333949' },
    { name: 'Râpe multi-faces inox', qrCode: '4006381333956' },
    { name: 'Ouvre-boîte manuel', qrCode: '4006381333963' },
  ],
  PLS: [
    { name: 'Bacs alimentaires hermétiques x5', qrCode: '8412345678901' },
    { name: 'Seau ménage 10 L avec couvercle', qrCode: '8412345678918' },
    { name: 'Bassine plastique 40 cm', qrCode: '8412345678925' },
    { name: 'Panier à linge 60 L', qrCode: '8412345678932' },
    { name: 'Boîte à épices 12 compartiments', qrCode: '8412345678949' },
  ],
  RNG: [
    { name: 'Égouttoir à vaisselle chrome', qrCode: '5012345678901' },
    { name: 'Range-couverts tiroir', qrCode: '5012345678918' },
    { name: 'Porte-rouleau essuie-tout mural', qrCode: '5012345678925' },
    { name: 'Étagère d’angle cuisine 3 niveaux', qrCode: '5012345678932' },
    { name: 'Boîte à pain inox', qrCode: '5012345678949' },
  ],
  ELE: [
    { name: 'Mixeur plongeant 600 W', qrCode: '3224567890123' },
    { name: 'Batteur électrique 300 W', qrCode: '3224567890130' },
    { name: 'Hachoir à viande électrique', qrCode: '3224567890147' },
    { name: 'Presse-agrumes électrique', qrCode: '3224567890154' },
  ],
};

/**
 * Fournisseurs / grossistes style marché algérien
 * (noms fictifs, formats NIF/NIS/RC & téléphones réalistes DZ)
 */
const SUPPLIERS = [
  {
    fullName: 'SARL Import Vaisselle El Djazaïr',
    phone: '023 81 45 67',
    location: 'Zone industrielle, Bab Ezzouar, Alger',
    nif: '001623456789012',
    nis: '19876543210987',
    rc: '16/00-0987654B16',
    email: 'contact@vaisselle-eldjazair.dz',
  },
  {
    fullName: 'EURL Maison du Verre',
    phone: '021 54 32 10',
    location: 'Rue Hassiba Ben Bouali, Hussein Dey, Alger',
    nif: '001698765432109',
    nis: '18765432109876',
    rc: '16/00-1122334B16',
    email: 'commercial@maisonduverre.dz',
  },
  {
    fullName: 'SPA Distri Cuisine Oranie',
    phone: '041 33 22 11',
    location: 'Zone d’activité Es Senia, Oran',
    nif: '003112345678901',
    nis: '17654321098765',
    rc: '31/00-0456789B31',
    email: 'ventes@districuisine-oran.dz',
  },
  {
    fullName: 'SARL MetalCook Algérie',
    phone: '0550 12 34 56',
    location: 'Zone industrielle Rouiba, Alger',
    nif: '001645678901234',
    nis: '16543210987654',
    rc: '16/00-2233445B16',
    email: 'info@metalcook.dz',
  },
  {
    fullName: 'STE Gros Ménage Sétif',
    phone: '036 84 56 78',
    location: 'Route de Constantine, Sétif',
    nif: '001978901234567',
    nis: '15432109876543',
    rc: '19/00-0678901B19',
    email: 'gros@menage-setif.dz',
  },
  {
    fullName: 'Import Export Tajine & Tradition',
    phone: '025 43 21 09',
    location: 'Zone industrielle, Blida',
    nif: '000934567890123',
    nis: '14321098765432',
    rc: '09/00-1345678B09',
    email: 'commande@tajine-tradition.dz',
  },
  {
    fullName: 'SARL Plastiques du Maghreb',
    phone: '0561 78 90 12',
    location: 'Les Eucalyptus, Alger',
    nif: '001656789012345',
    nis: '13210987654321',
    rc: '16/00-5566778B16',
    email: 'sales@plastiques-maghreb.dz',
  },
  {
    fullName: 'EURL Électro Cuisine Plus',
    phone: '0770 45 67 89',
    location: 'Centre commercial Bab Ezzouar, Alger',
    nif: '001667890123456',
    nis: '12109876543210',
    rc: '16/00-7788990B16',
    email: 'pro@electrocuisineplus.dz',
  },
];

function padSeq(n) {
  return String(n).padStart(4, '0');
}

async function seed() {
  if (!process.env.DB_URI) {
    console.error('Missing DB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.DB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Supplier.deleteMany({}),
    Lot.deleteMany({}),
  ]);
  console.log('Cleared categories, products, suppliers, lots');

  const categoryDocs = await Category.insertMany(
    CATEGORIES.map((c) => ({
      name: c.name,
      code: c.code,
      nextProductSeq: 1,
    }))
  );

  const byCode = Object.fromEntries(categoryDocs.map((c) => [c.code, c]));

  const products = [];
  for (const [code, items] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const category = byCode[code];
    if (!category) continue;

    let seq = 1;
    for (const item of items) {
      products.push({
        code: `${code}${padSeq(seq)}`,
        name: item.name,
        qrCode: item.qrCode || '',
        category: category._id,
        isActive: true,
      });
      seq += 1;
    }
    category.nextProductSeq = seq;
    await category.save();
  }

  await Product.insertMany(products);
  await Supplier.insertMany(SUPPLIERS);
  await Lot.insertMany(LOTS.map((l) => ({ ...l, isActive: true })));

  console.log(`Seeded ${categoryDocs.length} categories`);
  console.log(`Seeded ${products.length} products`);
  console.log(`Seeded ${SUPPLIERS.length} fournisseurs`);
  console.log(`Seeded ${LOTS.length} lots`);
  console.log('Done.');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
