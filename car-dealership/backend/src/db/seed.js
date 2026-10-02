const bcrypt = require('bcryptjs');
const { db } = require('./database');
const { migrate } = require('./migrate');

function seed() {
  migrate();

  const vehicleCount = db.prepare('SELECT COUNT(*) AS count FROM vehicles').get().count;
  if (vehicleCount === 0) {
    const insert = db.prepare(`
      INSERT INTO vehicles (make, model, year, category, price, quantity, description, fuel, gearbox, mileage, color, image_url)
      VALUES (@make, @model, @year, @category, @price, @quantity, @description, @fuel, @gearbox, @mileage, @color, @image_url)
    `);

    const vehicles = [
      { make: 'TESLA', model: 'MODEL 3 LONG RANGE', year: 2025, category: 'EV', price: 38990, quantity: 6, description: 'Dual-motor all-wheel drive with 341 miles of estimated range.', fuel: 'Electric', gearbox: 'Automatic', mileage: '12 mi', color: 'Midnight Silver', image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80' },
      { make: 'TOYOTA', model: 'CAMRY SE', year: 2024, category: 'SEDAN', price: 28450, quantity: 2, description: 'Balanced daily driver with sport-tuned suspension and low miles.', fuel: 'Gasoline', gearbox: 'Automatic', mileage: '8,400 mi', color: 'Ice Edge', image_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80' },
      { make: 'FORD', model: 'F-150 LARIAT', year: 2023, category: 'TRUCK', price: 52900, quantity: 4, description: '3.5L EcoBoost with tow package and Pro Power onboard generator.', fuel: 'Gasoline', gearbox: 'Automatic', mileage: '21,500 mi', color: 'Agate Black', image_url: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=800&q=80' },
      { make: 'BMW', model: 'M4 COMPETITION', year: 2024, category: 'COUPE', price: 84200, quantity: 2, description: '503 hp twin-turbo inline six with carbon bucket seats.', fuel: 'Gasoline', gearbox: 'Automatic', mileage: '3,100 mi', color: 'Isle of Man Green', image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80' },
      { make: 'HONDA', model: 'CR-V SPORT HYBRID', year: 2025, category: 'SUV', price: 34600, quantity: 5, description: 'Efficient hybrid crossover with 40 combined mpg and AWD.', fuel: 'Hybrid', gearbox: 'eCVT', mileage: '45 mi', color: 'Meteorite Gray', image_url: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=800&q=80' },
      { make: 'VOLKSWAGEN', model: 'GOLF GTI', year: 2023, category: 'HATCHBACK', price: 29750, quantity: 0, description: 'Six-speed manual hot hatch with adaptive damping.', fuel: 'Gasoline', gearbox: 'Manual', mileage: '14,200 mi', color: 'Kings Red', image_url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80' },
      { make: 'RIVIAN', model: 'R1T ADVENTURE', year: 2025, category: 'TRUCK', price: 73900, quantity: 2, description: 'Quad-motor electric pickup with 400+ miles of range.', fuel: 'Electric', gearbox: 'Automatic', mileage: '120 mi', color: 'Forest Green', image_url: 'https://images.unsplash.com/photo-1613214150483-4f269e6bb6cd?auto=format&fit=crop&w=800&q=80' }
    ];

    const insertMany = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(vehicles);
    console.log(`Seeded ${vehicles.length} vehicles.`);
  }

  // Backfill: if this database was created before vehicles had photos,
  // give any vehicle still missing an image a sensible category-based
  // fallback instead of leaving the showroom with blank cards.
  const CATEGORY_FALLBACK = {
    EV: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80',
    SEDAN: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80',
    TRUCK: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?auto=format&fit=crop&w=800&q=80',
    COUPE: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
    SUV: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=800&q=80',
    HATCHBACK: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
  };
  const unphotographed = db.prepare("SELECT id, category FROM vehicles WHERE image_url IS NULL OR image_url = ''").all();
  if (unphotographed.length) {
    const updateImage = db.prepare('UPDATE vehicles SET image_url = ? WHERE id = ?');
    const backfill = db.transaction((rows) => {
      for (const v of rows) {
        updateImage.run(CATEGORY_FALLBACK[v.category] || CATEGORY_FALLBACK.SEDAN, v.id);
      }
    });
    backfill(unphotographed);
    console.log(`Backfilled photos for ${unphotographed.length} existing vehicle(s).`);
  }

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)
    `);
    const adminHash = bcrypt.hashSync('Admin123!', 10);
    const customerHash = bcrypt.hashSync('Customer123!', 10);
    insertUser.run('admin@apexmotors.com', adminHash, 'ADMIN');
    insertUser.run('customer@apexmotors.com', customerHash, 'USER');
    console.log('Seeded demo users: admin@apexmotors.com / Admin123!  and  customer@apexmotors.com / Customer123!');
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
