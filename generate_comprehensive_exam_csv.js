const databaseService = require('./services/databaseService');

async function generateComprehensiveExamCSV() {
  try {
    // Initialize database connection
    const dbStatus = await databaseService.getDatabaseStatus();
    if (dbStatus.status !== 'connected') {
      console.log('Database not connected');
      return;
    }

    // Get timetable data (exams)
    const timetables = await databaseService.getTimetables();
    
    if (!timetables || timetables.length === 0) {
      console.log('No timetable data found');
      return;
    }

    // Get student data
    const students = await databaseService.getStudents();
    
    if (!students || students.length === 0) {
      console.log('No student data found');
      return;
    }

    // Create comprehensive CSV with exam and student data
    let csvContent = 'Exam Code,Subject,Date,Time,Status,Student Roll No,Student Name,Section,Email,Phone\n';
    
    // For each exam, assign a few sample students
    timetables.forEach((timetable, index) => {
      // Format date to YYYY-MM-DD
      let formattedDate = '';
      if (timetable.date) {
        if (typeof timetable.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(timetable.date)) {
          formattedDate = timetable.date;
        } else {
          const dateObj = new Date(timetable.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0];
          } else {
            formattedDate = timetable.date;
          }
        }
      }
      
      // For this example, we'll assign 3 students to each exam
      const studentsForThisExam = students.slice(index * 3, (index * 3) + 3);
      
      studentsForThisExam.forEach(student => {
        // Escape commas and quotes in fields
        const code = timetable.code ? `"${timetable.code.replace(/"/g, '""')}"` : '""';
        const subject = timetable.subject ? `"${timetable.subject.replace(/"/g, '""')}"` : '""';
        const date = formattedDate ? `"${formattedDate}"` : '""';
        const time = timetable.time ? `"${timetable.time.replace(/"/g, '""')}"` : '""';
        const status = timetable.status ? `"${timetable.status.replace(/"/g, '""')}"` : '""';
        const rollNo = student.rollNo ? `"${student.rollNo.replace(/"/g, '""')}"` : '""';
        const name = student.name ? `"${student.name.replace(/"/g, '""')}"` : '""';
        const section = student.section ? `"${student.section.replace(/"/g, '""')}"` : '""';
        const email = student.email ? `"${student.email.replace(/"/g, '""')}"` : '""';
        const phone = student.phone ? `"${student.phone.replace(/"/g, '""')}"` : '""';
        
        csvContent += `${code},${subject},${date},${time},${status},${rollNo},${name},${section},${email},${phone}\n`;
      });
    });
    
    // Write to file
    const fs = require('fs');
    const filePath = './comprehensive_exam_data.csv';
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`Comprehensive exam data CSV generated successfully at: ${filePath}`);
    console.log(`Total exams: ${timetables.length}`);
    console.log(`Total students: ${students.length}`);
    console.log(`Total exam-student combinations: ${timetables.length * 3}`);
    
    // Display first few rows as sample
    console.log('\nFirst 5 rows of the CSV:');
    console.log('Exam Code,Subject,Date,Time,Status,Student Roll No,Student Name,Section,Email,Phone');
    const lines = csvContent.split('\n');
    lines.slice(1, 6).forEach(line => {
      console.log(line);
    });
  } catch (error) {
    console.error('Error generating comprehensive exam CSV:', error);
  }
}

// Run the function
generateComprehensiveExamCSV();