const databaseService = require('./services/databaseService');

async function generateExamCSV() {
  try {
    // Initialize database connection
    const dbStatus = await databaseService.getDatabaseStatus();
    if (dbStatus.status !== 'connected') {
      console.log('Database not connected');
      return;
    }

    // Get timetable data
    const timetables = await databaseService.getTimetables();
    
    if (!timetables || timetables.length === 0) {
      console.log('No timetable data found');
      return;
    }

    // Create CSV header
    let csvContent = 'Exam Code,Subject,Date,Time,Status\n';
    
    // Add timetable data to CSV
    timetables.forEach(timetable => {
      // Format date to YYYY-MM-DD
      let formattedDate = '';
      if (timetable.date) {
        // If it's already a date string in YYYY-MM-DD format, use as is
        if (typeof timetable.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(timetable.date)) {
          formattedDate = timetable.date;
        } else {
          // Try to parse and format the date
          const dateObj = new Date(timetable.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0];
          } else {
            formattedDate = timetable.date;
          }
        }
      }
      
      // Escape commas and quotes in fields
      const code = timetable.code ? `"${timetable.code.replace(/"/g, '""')}"` : '""';
      const subject = timetable.subject ? `"${timetable.subject.replace(/"/g, '""')}"` : '""';
      const date = formattedDate ? `"${formattedDate}"` : '""';
      const time = timetable.time ? `"${timetable.time.replace(/"/g, '""')}"` : '""';
      const status = timetable.status ? `"${timetable.status.replace(/"/g, '""')}"` : '""';
      
      csvContent += `${code},${subject},${date},${time},${status}\n`;
    });
    
    // Write to file
    const fs = require('fs');
    const filePath = './sample_exam_data.csv';
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`Sample exam data CSV generated successfully at: ${filePath}`);
    console.log(`Total exams: ${timetables.length}`);
    
    // Display first few rows as sample
    console.log('\nFirst 5 rows of the CSV:');
    console.log('Exam Code,Subject,Date,Time,Status');
    timetables.slice(0, 5).forEach(timetable => {
      // Format date for display
      let displayDate = '';
      if (timetable.date) {
        if (typeof timetable.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(timetable.date)) {
          displayDate = timetable.date;
        } else {
          const dateObj = new Date(timetable.date);
          if (!isNaN(dateObj.getTime())) {
            displayDate = dateObj.toISOString().split('T')[0];
          } else {
            displayDate = timetable.date;
          }
        }
      }
      console.log(`${timetable.code},${timetable.subject},${displayDate},${timetable.time},${timetable.status}`);
    });
  } catch (error) {
    console.error('Error generating exam CSV:', error);
  }
}

// Run the function
generateExamCSV();