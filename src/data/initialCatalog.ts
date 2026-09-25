import { Product } from '../types/kiosk.ts';

// Photography assets
import coffeeHeroImg from '../assets/images/coffee_atelier_hero_1790359067443.jpg';
import coffeeLatteImg from '../assets/images/coffee_latte_art_crema_1790359078521.jpg';
import artisanCoffeeImg from '../assets/images/kiosk_artisan_coffee_1790321476364.jpg';
import pastriesImg from '../assets/images/kiosk_butter_pastries_1790321488858.jpg';
import icedDrinksImg from '../assets/images/kiosk_iced_drinks_1790321513642.jpg';
import espressoMartiniImg from '../assets/images/amica_espresso_martini_1790357443979.jpg';
import negroniImg from '../assets/images/amica_negroni_1790357409028.jpg';
import aperolSpritzImg from '../assets/images/amica_aperol_spritz_1790357420821.jpg';
import burrataImg from '../assets/images/amica_burrata_1790357482052.jpg';
import truffleAranciniImg from '../assets/images/amica_truffle_arancini_1790357507145.jpg';
import focacciaImg from '../assets/images/amica_focaccia_1790357518390.jpg';
import cacioPepeImg from '../assets/images/amica_cacio_pepe_1790357546043.jpg';
import margheritaPizzaImg from '../assets/images/amica_margherita_pizza_1790357570050.jpg';
import tiramisuImg from '../assets/images/amica_tiramisu_1790357580806.jpg';
import affogatoImg from '../assets/images/amica_affogato_1790357592736.jpg';

export { coffeeHeroImg };

export const INITIAL_PRODUCTS: Product[] = [
  // --- SPECIALTY COFFEE & ROASTERY ---
  {
    id: 'prod_flat_white',
    name: 'Silky Flat White',
    category: 'Specialty Coffee',
    price: 4.80,
    image: coffeeLatteImg,
    description: 'Double ristretto pull of house roasted Ethiopian heirloom beans with velvety microfoam and rosetta art.',
    dietary: ['House Roastery', 'Single Origin'],
    stock: 45,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'milk',
        name: 'Milk Preference',
        options: [
          { name: 'Organic Whole Milk', priceDelta: 0 },
          { name: 'Oat Milk (Barista Edition)', priceDelta: 0.50 },
          { name: 'Almond Milk', priceDelta: 0.50 },
        ],
      },
      {
        id: 'roast',
        name: 'Bean Selection',
        options: [
          { name: 'House Reserve (Cacao & Hazelnut)', priceDelta: 0 },
          { name: 'Ethiopia Yirgacheffe (Floral & Bergamot)', priceDelta: 0.80 },
        ],
      },
    ],
  },
  {
    id: 'prod_espresso_doppio',
    name: 'Espresso Doppio',
    category: 'Specialty Coffee',
    price: 3.80,
    image: coffeeHeroImg,
    description: 'Double shot of freshly ground specialty beans with thick golden tiger-striped crema in artisanal ceramic.',
    dietary: ['Pure Origin', 'Caffeine Push'],
    stock: 50,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'blend',
        name: 'Origin Profile',
        options: [
          { name: 'Medium Roast (Citrus & Honey)', priceDelta: 0 },
          { name: 'Dark Roast (Dark Cocoa & Molasses)', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'prod_cold_brew',
    name: 'Nitro Cold Brew Tonic',
    category: 'Specialty Coffee',
    price: 5.50,
    image: icedDrinksImg,
    description: '18-hour slow cold steep infused with micro nitrogen bubbles, served over clear ice with Mediterranean tonic & orange wheel.',
    dietary: ['Refreshing', 'Low Acidity'],
    stock: 30,
    isAvailable: true,
  },
  {
    id: 'prod_cortado',
    name: 'Velvet Cortado',
    category: 'Specialty Coffee',
    price: 4.20,
    image: artisanCoffeeImg,
    description: 'Equal parts single origin espresso and silky warm milk in a heavy fluted glass.',
    dietary: ['Balanced', 'Spanish Heritage'],
    stock: 35,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'milk',
        name: 'Milk Choice',
        options: [
          { name: 'Dairy Whole Milk', priceDelta: 0 },
          { name: 'Oat Microfoam', priceDelta: 0.50 },
        ],
      },
    ],
  },

  // --- SIGNATURE COCKTAILS ---
  {
    id: 'prod_espresso_martini',
    name: 'Artisan Espresso Martini',
    category: 'Cocktails',
    price: 13.00,
    image: espressoMartiniImg,
    description: 'Single estate Ketel One vodka, fresh pulled house espresso, Kahlúa, crowned with thick crema foam & three roasted beans.',
    dietary: ['Nightcap', 'Signature'],
    stock: 30,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'roast',
        name: 'Espresso Profile',
        options: [
          { name: 'House Dark Roast', priceDelta: 0 },
          { name: 'Single Origin Decaf', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'prod_negroni',
    name: 'Negroni Classico',
    category: 'Cocktails',
    price: 12.00,
    image: negroniImg,
    description: 'Campari, Cocchi Storico Vermouth di Torino, Tanqueray London Dry Gin, flamed orange peel over a crystal rock.',
    dietary: ['Art Deco Classic', 'Spirit Forward'],
    stock: 35,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'gin',
        name: 'Gin Selection',
        options: [
          { name: 'Tanqueray London Dry', priceDelta: 0 },
          { name: 'Monkey 47 Black Forest', priceDelta: 3.00 },
        ],
      },
    ],
  },
  {
    id: 'prod_aperol_spritz',
    name: 'Aperol Spritz',
    category: 'Cocktails',
    price: 11.00,
    image: aperolSpritzImg,
    description: 'Aperol, Prosecco DOCG Superiore, splash of club soda, fresh Sicilian orange wheel & Cerignola olive.',
    dietary: ['Aperitivo', 'Refreshing'],
    stock: 45,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'soda',
        name: 'Soda Ratio',
        options: [
          { name: 'Standard Venetian Ratio', priceDelta: 0 },
          { name: 'Extra Soda (Lighter)', priceDelta: 0 },
        ],
      },
    ],
  },

  // --- BAKERY & DESSERTS ---
  {
    id: 'prod_affogato',
    name: 'Affogato al Caffè',
    category: 'Desserts',
    price: 8.00,
    image: affogatoImg,
    description: 'Artisanal Fior di Latte gelato drowned table-side in a double shot of hot freshly pulled espresso.',
    dietary: ['Vegetarian', 'Gluten-Free'],
    stock: 25,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'liqueur',
        name: 'Liqueur Addition',
        options: [
          { name: 'Pure Espresso Only', priceDelta: 0 },
          { name: 'Add Disaronno Amaretto', priceDelta: 3.50 },
          { name: 'Add Frangelico Hazelnut', priceDelta: 3.50 },
        ],
      },
    ],
  },
  {
    id: 'prod_tiramisu',
    name: 'Tiramisu Tradizionale',
    category: 'Desserts',
    price: 9.00,
    image: tiramisuImg,
    description: 'Savoiardi ladyfingers soaked in dark espresso and Marsala wine, layered with mascarpone cream and dusted with Valrhona cocoa.',
    dietary: ['Classic Italian', 'Vegetarian'],
    stock: 18,
    isAvailable: true,
  },
  {
    id: 'prod_croissant_pastries',
    name: 'Warm Butter Pastries',
    category: 'Bakery',
    price: 5.50,
    image: pastriesImg,
    description: 'Flaky Normandy butter croissant and pain au chocolat served warm with whipped salted butter & espresso jam.',
    dietary: ['Freshly Baked', 'Normandy Butter'],
    stock: 20,
    isAvailable: true,
  },

  // --- CUCINA & SMALL PLATES ---
  {
    id: 'prod_burrata',
    name: 'Burrata Pugliese',
    category: 'Small Plates',
    price: 14.00,
    image: burrataImg,
    description: 'Creamy Pugliese burrata, slow-roasted Datterini tomatoes, basil oil, and smoked Maldon salt.',
    dietary: ['Vegetarian', 'Puglia DOP'],
    stock: 18,
    isAvailable: true,
    customizationGroups: [
      {
        id: 'bread',
        name: 'Accompaniment',
        options: [
          { name: 'Add Warm Focaccia', priceDelta: 3.50 },
          { name: 'Without Bread', priceDelta: 0 },
        ],
      },
    ],
  },
  {
    id: 'prod_truffle_arancini',
    name: 'Truffle Arancini',
    category: 'Small Plates',
    price: 11.00,
    image: truffleAranciniImg,
    description: 'Wild forest mushroom and black summer truffle risotto balls rolled in panko, aged pecorino cream.',
    dietary: ['House Signature', 'Vegetarian'],
    stock: 16,
    isAvailable: true,
  },
  {
    id: 'prod_focaccia',
    name: 'Warm Rosemary Focaccia',
    category: 'Small Plates',
    price: 7.00,
    image: focacciaImg,
    description: 'Freshly baked Ligurian rosemary & sea salt focaccia served warm with whipped salted ricotta and olive oil.',
    dietary: ['Freshly Baked', 'Vegetarian'],
    stock: 24,
    isAvailable: true,
  },
  {
    id: 'prod_cacio_pepe',
    name: 'Cacio e Pepe',
    category: 'Pasta',
    price: 16.00,
    image: cacioPepeImg,
    description: 'Handmade fresh tonnarelli pasta, 24-month aged Pecorino Romano DOP, coarse toasted Tellicherry black pepper.',
    dietary: ['Handmade Pasta', 'Vegetarian'],
    stock: 20,
    isAvailable: true,
  },
  {
    id: 'prod_margherita',
    name: 'Sourdough Margherita',
    category: 'Pizza',
    price: 15.00,
    image: margheritaPizzaImg,
    description: 'Wood-fired 48-hour fermented sourdough crust, San Marzano tomato DOP, fior di latte mozzarella, fresh basil.',
    dietary: ['Wood-Fired', 'Vegetarian'],
    stock: 25,
    isAvailable: true,
  },
];

export const CATEGORIES = [
  'All Items',
  'Specialty Coffee',
  'Cocktails',
  'Bakery',
  'Desserts',
  'Small Plates',
  'Pasta',
  'Pizza',
] as const;
