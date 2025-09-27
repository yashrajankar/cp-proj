// import-rooms-direct.js
// Script to import rooms directly using database service

const fs = require('fs');
const path = require('path');
const databaseService = require('./services/databaseService');

// Function to parse CSV data
function parseCsvData(csvText) {
  // Normalize line endings
  const normalizedText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.trim().split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }
  
  // Handle potential BOM (Byte Order Mark)
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }
  
  const headers = headerLine.split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length > 0 && values.some(val => val.trim() !== '')) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = index < values.length ? values[index] : '';
      });
      data.push(row);
    }
  }
  
  return data;
}

async function importRoomsDirect() {
  try {
    console.log('Importing rooms directly...');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, 'import', 'rooms.csv');
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const data = parseCsvData(csvText);
    
    console.log(`Found ${data.length} rooms in CSV`);
    
    // Transform data to match database expectations
    const rooms = data.map(row => ({
      number: row['number'] || '',
      building: row['building'] || '',
      capacity: parseInt(row['capacity'] || 0)
    }));
    
    // Filter out empty rows
    const validRooms = rooms.filter(r => r.number && r.building && r.capacity > 0);
    
    console.log(`Importing ${validRooms.length} valid rooms`);
    
    if (validRooms.length === 0) {
      throw new Error('No valid room data found');
    }
    
    // Import rooms using database service
    const results = await databaseService.createRooms(validRooms);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successfully imported ${successful} rooms (${failed} failed)`);
    
    // Show failed imports
    if (failed > 0) {
      console.log('Failed imports:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.room.number} in ${r.room.building}: ${r.error}`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error importing rooms:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  importRoomsDirect().then(() => {
    console.log('✅ Room import completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Room import failed:', error.message);
    process.exit(1);
  });
}

module.exports = { importRoomsDirect };