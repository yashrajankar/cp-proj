// services/databaseService.js
// Database service for MySQL operations

const { pool, checkConnectionHealth, getPoolStats } = require('../config/db');

class DatabaseService {
  // Helper function to convert JavaScript Date to MySQL datetime format
  toMySQLDateTime(date) {
    if (!date) return null;
    if (typeof date === 'string') {
      // Convert ISO string to MySQL datetime format
      return date.replace('T', ' ').substring(0, 19);
    }
    if (date instanceof Date) {
      // Convert Date object to MySQL datetime format
      return date.toISOString().replace('T', ' ').substring(0, 19);
    }
    return null;
  }

  // Helper function to get database status with enhanced error handling
  async getDatabaseStatus() {
    try {
      // First check connection health
      const health = await checkConnectionHealth();
      if (health.status !== 'healthy') {
        return {
          status: 'disconnected',
          error: health.error || 'Database connection unhealthy',
          timestamp: new Date().toISOString()
        };
      }

      const connection = await pool.getConnection();
      
      // Get database name
      let databaseName = null;
      try {
        const [dbRows] = await connection.execute('SELECT DATABASE() as databaseName');
        databaseName = dbRows && dbRows[0] ? dbRows[0].databaseName : null;
      } catch (dbError) {
        console.error('Error fetching database name:', dbError);
        databaseName = null;
      }
      
      // Get table information
      let tables = [];
      try {
        [tables] = await connection.execute('SHOW TABLES');
      } catch (tableError) {
        console.error('Error fetching tables:', tableError);
        tables = [];
      }
      
      // Get row counts for major tables
      const tableCounts = {};
      const importantTables = ['users', 'students', 'timetables', 'staff', 'rooms', 'seating_plans', 'sessions', 'notifications', 'daily_assignments', 'staff_allocations'];
      
      for (const table of importantTables) {
        try {
          const [countRows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          tableCounts[table] = countRows[0].count;
        } catch (error) {
          tableCounts[table] = 'Table not found';
        }
      }
      
      connection.release();
      
      // Get pool statistics
      const poolStats = getPoolStats();
      
      return {
        status: 'connected',
        database: databaseName,
        tables: tables && Array.isArray(tables) ? tables.length : 0,
        tableList: tables && Array.isArray(tables) ? tables.map(table => Object.values(table)[0]) : [],
        tableCounts: tableCounts,
        poolStats: poolStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Database status check failed:', error);
      return {
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generic method to execute queries with enhanced error handling
  async executeQuery(query, params = []) {
    let connection;
    try {
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timed out after 30 seconds')), 30000);
      });
      
      const queryPromise = (async () => {
        connection = await pool.getConnection();
        const [results] = await connection.execute(query, params);
        return results;
      })();
      
      return await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      // Log detailed error information
      console.error('Database query failed:');
      console.error('  Query:', query);
      console.error('  Params:', params);
      console.error('  Error:', error.message);
      
      // Provide more specific error messages
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Database connection refused. Check if MySQL server is running.');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        throw new Error('Access denied to database. Check username and password.');
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        throw new Error('Database does not exist. Check database name.');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Database host not found. Check database host configuration.');
      } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        throw new Error('Database connection was lost. Please try again.');
      } else if (error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        throw new Error('Database connection failed. Please restart the application.');
      } else if (error.errno === 'ETIMEDOUT' || error.message.includes('timed out')) {
        throw new Error('Database connection timed out. Check network connectivity.');
      } else if (error.message.includes('getaddrinfo')) {
        throw new Error('DNS resolution failed. Check database host configuration.');
      }
      
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  // Students operations
  async getStudents(searchTerm = null, sectionFilter = null) {
    let query = 'SELECT id as _id, rollNo, name, section, email, phone FROM students';
    const params = [];
    
    // Add filtering conditions
    const conditions = [];
    
    if (searchTerm) {
      conditions.push('(rollNo LIKE ? OR name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (sectionFilter) {
      conditions.push('section = ?');
      params.push(sectionFilter);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY rollNo';
    
    try {
      const results = await this.executeQuery(query, params);
      console.log(`Fetched ${results.length} students with search: ${searchTerm}, section: ${sectionFilter}`);
      return results;
    } catch (error) {
      console.error('Error in getStudents:', error);
      throw error;
    }
  }

  async getStudentById(id) {
    const rows = await this.executeQuery('SELECT id as _id, rollNo, name, section, email, phone FROM students WHERE id = ?', [id]);
    return rows[0];
  }

  async getStudentByRollNo(rollNo) {
    const [rows] = await pool.execute('SELECT id as _id, rollNo, name, section, email, phone FROM students WHERE rollNo = ?', [rollNo]);
    return rows[0];
  }

  async createStudent(student) {
    const { rollNo, name, section, email, phone, profilePicture } = student;
    try {
      // Clean up any trailing carriage returns from CSV parsing
      const cleanEmail = email ? email.replace(/\r$/, '') : email;
      const cleanPhone = phone ? phone.replace(/\r$/, '') : phone;
      
      const result = await this.executeQuery(
        'INSERT INTO students (rollNo, name, section, email, phone, profilePicture) VALUES (?, ?, ?, ?, ?, ?)',
        [rollNo, name, section, cleanEmail, cleanPhone, profilePicture || null]
      );
      return result;
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Student with this roll number already exists');
      }
      throw error;
    }
  }

  // Bulk create students with better error handling
  async createStudents(students) {
    const results = [];
    
    // Validate input
    if (!Array.isArray(students) || students.length === 0) {
      return results;
    }
    
    for (const student of students) {
      try {
        // Skip empty rows
        if (!student.rollNo && !student.name && !student.section) {
          results.push({ success: false, error: 'Empty row', student });
          continue;
        }
        
        // Validate required fields
        if (!student.rollNo || !student.name || !student.section) {
          results.push({ success: false, error: 'Missing required fields: rollNo, name, section', student });
          continue;
        }
        
        // Validate section
        const validSections = ['B1', 'B2', 'B3'];
        if (!validSections.includes(student.section)) {
          results.push({ success: false, error: `Invalid section: ${student.section}. Must be one of: B1, B2, B3`, student });
          continue;
        }
        
        // Clean up any trailing carriage returns from CSV parsing
        const cleanStudent = {
          ...student,
          email: student.email ? student.email.replace(/\r$/, '') : student.email,
          phone: student.phone ? student.phone.replace(/\r$/, '') : student.phone
        };
        
        const result = await this.createStudent(cleanStudent);
        results.push({ success: true, result, student: cleanStudent });
      } catch (error) {
        // Handle duplicate entry error specifically
        if (error.code === 'ER_DUP_ENTRY') {
          results.push({ success: false, error: `Student with roll number ${student.rollNo} already exists`, student });
        } else {
          results.push({ success: false, error: error.message, student });
        }
      }
    }
    return results;
  }

  async updateStudent(id, student) {
    const { rollNo, name, section, email, phone, profilePicture } = student;
    const [result] = await pool.execute(
      'UPDATE students SET rollNo = ?, name = ?, section = ?, email = ?, phone = ?, profilePicture = ? WHERE id = ?',
      [rollNo, name, section, email, phone, profilePicture || null, id]
    );
    return result;
  }

  async deleteStudent(id) {
    const [result] = await pool.execute('DELETE FROM students WHERE id = ?', [id]);
    return result;
  }

  // Clear all students
  async clearStudents() {
    const [result] = await pool.execute('DELETE FROM students');
    return result;
  }

  // Get student statistics
  async getStudentStats() {
    try {
      const totalStudentsResult = await this.executeQuery('SELECT COUNT(*) as count FROM students');
      const sectionStatsResult = await this.executeQuery(`
        SELECT 
          section,
          COUNT(*) as count
        FROM students 
        WHERE section IN ('B1', 'B2', 'B3')
        GROUP BY section
      `);
      
      const classesResult = await this.executeQuery('SELECT COUNT(DISTINCT section) as count FROM students');
      
      // Initialize section counts
      const sectionCounts = {
        'B1': 0,
        'B2': 0,
        'B3': 0
      };
      
      // Fill in actual counts - check if sectionStatsResult exists and is an array
      if (sectionStatsResult && Array.isArray(sectionStatsResult)) {
        sectionStatsResult.forEach(row => {
          if (row && row.section) {
            sectionCounts[row.section] = row.count || 0;
          }
        });
      }
      
      // Ensure we handle cases where results might be undefined
      const totalStudents = totalStudentsResult && totalStudentsResult.length > 0 ? 
        (totalStudentsResult[0].count || 0) : 0;
        
      const totalClasses = classesResult && classesResult.length > 0 ? 
        (classesResult[0].count || 0) : 0;
      
      return {
        totalStudents: totalStudents,
        sectionCounts,
        totalClasses: totalClasses
      };
    } catch (error) {
      console.error('Error fetching student stats:', error);
      throw error;
    }
  }

  // Timetables operations
  async getTimetables(searchTerm = null) {
    let query = 'SELECT id as _id, code, subject, date, time, status FROM timetables';
    const params = [];
    
    // Add search filtering conditions
    if (searchTerm) {
      query += ' WHERE (code LIKE ? OR subject LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern);
    }
    
    query += ' ORDER BY date, time';
    
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getTimetableById(id) {
    const [rows] = await pool.execute('SELECT id as _id, code, subject, date, time, status FROM timetables WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async getTimetableByCode(code) {
    const [rows] = await pool.execute('SELECT id as _id, code, subject, date, time, status FROM timetables WHERE code = ?', [code]);
    return rows[0];
  }

  async createTimetable(timetable) {
    const { code, subject, date, time, status } = timetable;
    try {
      const [result] = await pool.execute(
        'INSERT INTO timetables (code, subject, date, time, status) VALUES (?, ?, ?, ?, ?)',
        [code, subject, date, time, status]
      );
      return result;
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Timetable with this code already exists');
      }
      throw error;
    }
  }

  // Bulk create timetables
  async createTimetables(timetables) {
    const results = [];
    for (const timetable of timetables) {
      try {
        // Skip empty rows
        if (!timetable.code && !timetable.subject && !timetable.date && !timetable.time && !timetable.status) {
          continue;
        }
        
        // Validate required fields
        if (!timetable.code || !timetable.subject || !timetable.date || !timetable.time || !timetable.status) {
          results.push({ success: false, error: 'Missing required fields: code, subject, date, time, status', timetable });
          continue;
        }
        
        const result = await this.createTimetable(timetable);
        results.push({ success: true, result, timetable });
      } catch (error) {
        results.push({ success: false, error: error.message, timetable });
      }
    }
    return results;
  }

  async updateTimetable(id, timetable) {
    // Get the existing timetable entry to preserve unchanged fields
    const existingTimetable = await this.getTimetableById(id);
    
    // Check if the timetable entry exists
    if (!existingTimetable) {
      throw new Error('Timetable entry not found');
    }
    
    // Merge the existing timetable data with the updates
    const updatedTimetable = {
      code: timetable.code !== undefined ? timetable.code : existingTimetable.code,
      subject: timetable.subject !== undefined ? timetable.subject : existingTimetable.subject,
      date: timetable.date !== undefined ? timetable.date : existingTimetable.date,
      time: timetable.time !== undefined ? timetable.time : existingTimetable.time,
      status: timetable.status !== undefined ? timetable.status : existingTimetable.status
    };
    
    const [result] = await pool.execute(
      'UPDATE timetables SET code = ?, subject = ?, date = ?, time = ?, status = ? WHERE id = ?',
      [updatedTimetable.code, updatedTimetable.subject, updatedTimetable.date, updatedTimetable.time, updatedTimetable.status, id]
    );
    return result;
  }

  async deleteTimetable(id) {
    const [result] = await pool.execute('DELETE FROM timetables WHERE id = ?', [id]);
    return result;
  }

  // Clear all timetables
  async clearTimetables() {
    const [result] = await pool.execute('DELETE FROM timetables');
    return result;
  }

  // Get dashboard report with date filtering
  async getDashboardReport(startDate = null, endDate = null) {
    try {
      const connection = await pool.getConnection();
      
      // Get total students
      const [studentCount] = await connection.execute('SELECT COUNT(*) as count FROM students');
      
      // Get total exams
      const [examCount] = await connection.execute('SELECT COUNT(*) as count FROM timetables');
      
      // Get students by section
      const [studentsBySection] = await connection.execute(`
        SELECT 
          section,
          COUNT(*) as count
        FROM students 
        WHERE section IN ('B1', 'B2', 'B3')
        GROUP BY section
        ORDER BY section
      `);
      
      // Get average attendance
      const [attendanceStats] = await connection.execute(`
        SELECT 
          AVG(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) * 100 as avg_attendance
        FROM attendance
        WHERE status IN ('Present', 'Absent', 'Late')
        ${startDate && endDate ? 'AND date BETWEEN ? AND ?' : ''}
      `, startDate && endDate ? [startDate, endDate] : []);
      
      const avgAttendance = attendanceStats[0].avg_attendance ? 
        Math.round(attendanceStats[0].avg_attendance) : 0;
      
      // Get results distribution
      const [resultsDistribution] = await connection.execute(`
        SELECT 
          CASE 
            WHEN (marksObtained / totalMarks * 100) >= 90 THEN 'A+'
            WHEN (marksObtained / totalMarks * 100) >= 80 THEN 'A'
            WHEN (marksObtained / totalMarks * 100) >= 70 THEN 'B'
            WHEN (marksObtained / totalMarks * 100) >= 60 THEN 'C'
            WHEN (marksObtained / totalMarks * 100) >= 50 THEN 'D'
            WHEN (marksObtained / totalMarks * 100) >= 40 THEN 'E'
            ELSE 'F'
          END as grade,
          COUNT(*) as count
        FROM results
        WHERE marksObtained IS NOT NULL AND totalMarks > 0
        ${startDate && endDate ? 'AND examDate BETWEEN ? AND ?' : ''}
        GROUP BY 
          CASE 
            WHEN (marksObtained / totalMarks * 100) >= 90 THEN 'A+'
            WHEN (marksObtained / totalMarks * 100) >= 80 THEN 'A'
            WHEN (marksObtained / totalMarks * 100) >= 70 THEN 'B'
            WHEN (marksObtained / totalMarks * 100) >= 60 THEN 'C'
            WHEN (marksObtained / totalMarks * 100) >= 50 THEN 'D'
            WHEN (marksObtained / totalMarks * 100) >= 40 THEN 'E'
            ELSE 'F'
          END
        ORDER BY grade
      `, startDate && endDate ? [startDate, endDate] : []);
      
      // Get performance by subject
      const [performanceBySubject] = await connection.execute(`
        SELECT 
          subject,
          AVG(marksObtained / totalMarks * 100) as average
        FROM results
        WHERE marksObtained IS NOT NULL AND totalMarks > 0
        ${startDate && endDate ? 'AND examDate BETWEEN ? AND ?' : ''}
        GROUP BY subject
        ORDER BY average DESC
      `, startDate && endDate ? [startDate, endDate] : []);
      
      // Get top performing students
      const [topStudents] = await connection.execute(`
        SELECT 
          s.name,
          s.rollNo,
          AVG(r.marksObtained / r.totalMarks * 100) as averageMarks
        FROM results r
        JOIN students s ON r.studentId = s.id
        WHERE r.marksObtained IS NOT NULL AND r.totalMarks > 0
        ${startDate && endDate ? 'AND r.examDate BETWEEN ? AND ?' : ''}
        GROUP BY s.id, s.name, s.rollNo
        ORDER BY averageMarks DESC
        LIMIT 10
      `, startDate && endDate ? [startDate, endDate] : []);
      
      // Get low performing students
      const [lowStudents] = await connection.execute(`
        SELECT 
          s.name,
          s.rollNo,
          AVG(r.marksObtained / r.totalMarks * 100) as averageMarks
        FROM results r
        JOIN students s ON r.studentId = s.id
        WHERE r.marksObtained IS NOT NULL AND r.totalMarks > 0
        ${startDate && endDate ? 'AND r.examDate BETWEEN ? AND ?' : ''}
        GROUP BY s.id, s.name, s.rollNo
        ORDER BY averageMarks ASC
        LIMIT 10
      `, startDate && endDate ? [startDate, endDate] : []);
      
      // Calculate pass rate (assuming 40% is passing)
      const [passStats] = await connection.execute(`
        SELECT 
          COUNT(CASE WHEN (marksObtained / totalMarks * 100) >= 40 THEN 1 END) as pass_count,
          COUNT(*) as total_count
        FROM results
        WHERE marksObtained IS NOT NULL AND totalMarks > 0
        ${startDate && endDate ? 'AND examDate BETWEEN ? AND ?' : ''}
      `, startDate && endDate ? [startDate, endDate] : []);
      
      const passRate = passStats[0].total_count > 0 ? 
        Math.round((passStats[0].pass_count / passStats[0].total_count) * 100) : 0;
      
      connection.release();
      
      return {
        totalStudents: studentCount[0].count,
        totalExams: examCount[0].count,
        studentsBySection: studentsBySection,
        avgAttendance: avgAttendance,
        resultsDistribution: resultsDistribution,
        performanceBySubject: performanceBySubject.map(item => ({
          ...item,
          average: Math.round(item.average)
        })),
        topPerformingStudents: topStudents,
        lowPerformingStudents: lowStudents,
        passRate: passRate
      };
    } catch (error) {
      console.error('Error fetching dashboard report:', error);
      throw error;
    }
  }

  // Seating plans operations
  async getSeatingPlans() {
    try {
      const query = 'SELECT id as _id, planData, examDate, examCode, createdAt, updatedAt FROM seating_plans ORDER BY createdAt DESC';
      const rows = await this.executeQuery(query);
      return rows.map(row => {
        let planData = {};
        if (row.planData) {
          // Check if planData is already an object or needs to be parsed
          if (typeof row.planData === 'string') {
            try {
              planData = JSON.parse(row.planData);
            } catch (parseError) {
              console.warn('Failed to parse planData, using as-is:', row.planData);
              planData = row.planData;
            }
          } else {
            planData = row.planData;
          }
        }
        return {
          ...row,
          planData
        };
      });
    } catch (error) {
      console.error('Error in getSeatingPlans:', error);
      throw error;
    }
  }

  async getSeatingPlanById(id) {
    try {
      const query = 'SELECT id as _id, planData, examDate, examCode, createdAt, updatedAt FROM seating_plans WHERE id = ?';
      const rows = await this.executeQuery(query, [id]);
      if (rows.length === 0) return null;
      const row = rows[0];
      let planData = {};
      if (row.planData) {
        // Check if planData is already an object or needs to be parsed
        if (typeof row.planData === 'string') {
          try {
            planData = JSON.parse(row.planData);
          } catch (parseError) {
            console.warn('Failed to parse planData, using as-is:', row.planData);
            planData = row.planData;
          }
        } else {
          planData = row.planData;
        }
      }
      return {
        ...row,
        planData
      };
    } catch (error) {
      console.error('Error in getSeatingPlanById:', error);
      throw error;
    }
  }

  async getSeatingPlanByDateAndCode(examDate, examCode) {
    try {
      const query = 'SELECT id as _id, planData, examDate, examCode, createdAt, updatedAt FROM seating_plans WHERE examDate = ? AND examCode = ?';
      const rows = await this.executeQuery(query, [examDate, examCode]);
      if (rows.length === 0) return null;
      const row = rows[0];
      let planData = {};
      if (row.planData) {
        // Check if planData is already an object or needs to be parsed
        if (typeof row.planData === 'string') {
          try {
            planData = JSON.parse(row.planData);
          } catch (parseError) {
            console.warn('Failed to parse planData, using as-is:', row.planData);
            planData = row.planData;
          }
        } else {
          planData = row.planData;
        }
      }
      return {
        ...row,
        planData
      };
    } catch (error) {
      console.error('Error in getSeatingPlanByDateAndCode:', error);
      throw error;
    }
  }

  async createSeatingPlan(seatingPlan) {
    try {
      const { planData, examDate, examCode } = seatingPlan;
      const planDataString = planData ? JSON.stringify(planData) : '{}';
      
      const query = 'INSERT INTO seating_plans (planData, examDate, examCode) VALUES (?, ?, ?)';
      const result = await this.executeQuery(query, [planDataString, examDate, examCode]);
      return result;
    } catch (error) {
      console.error('Error in createSeatingPlan:', error);
      throw error;
    }
  }

  async updateSeatingPlan(id, seatingPlan) {
    try {
      const { planData, examDate, examCode } = seatingPlan;
      const planDataString = planData ? JSON.stringify(planData) : '{}';
      
      const query = 'UPDATE seating_plans SET planData = ?, examDate = ?, examCode = ? WHERE id = ?';
      const result = await this.executeQuery(query, [planDataString, examDate, examCode, id]);
      return result;
    } catch (error) {
      console.error('Error in updateSeatingPlan:', error);
      throw error;
    }
  }

  async deleteSeatingPlan(id) {
    try {
      const query = 'DELETE FROM seating_plans WHERE id = ?';
      const result = await this.executeQuery(query, [id]);
      return result;
    } catch (error) {
      console.error('Error in deleteSeatingPlan:', error);
      throw error;
    }
  }

  async clearSeatingPlans() {
    try {
      const query = 'DELETE FROM seating_plans';
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Error in clearSeatingPlans:', error);
      throw error;
    }
  }

  // Notifications operations
  async getNotifications() {
    try {
      const query = 'SELECT id as _id, title, message, type, priority, recipientType, status, sendEmail, isActive, createdAt, updatedAt FROM notifications ORDER BY createdAt DESC';
      const rows = await this.executeQuery(query);
      return rows;
    } catch (error) {
      console.error('Error in getNotifications:', error);
      throw error;
    }
  }

  async getNotificationById(id) {
    try {
      const query = 'SELECT id as _id, title, message, type, priority, recipientType, status, sendEmail, isActive, createdAt, updatedAt FROM notifications WHERE id = ?';
      const rows = await this.executeQuery(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getNotificationById:', error);
      throw error;
    }
  }

  async getNotificationByTitleAndMessage(title, message) {
    try {
      const query = 'SELECT id as _id, title, message, type, priority, recipientType, status, sendEmail, isActive, createdAt, updatedAt FROM notifications WHERE title = ? AND message = ?';
      const rows = await this.executeQuery(query, [title, message]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getNotificationByTitleAndMessage:', error);
      throw error;
    }
  }

  async createNotification(notification) {
    try {
      const { title, message, type, priority, recipientType, status, sendEmail, isActive } = notification;
      const query = 'INSERT INTO notifications (title, message, type, priority, recipientType, status, sendEmail, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const result = await this.executeQuery(query, [title, message, type || 'info', priority || 'medium', recipientType || 'all', status || 'unread', sendEmail || false, isActive || true]);
      return result;
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  async updateNotification(id, notification) {
    try {
      const { title, message, type, priority, recipientType, status, sendEmail, isActive } = notification;
      const query = 'UPDATE notifications SET title = ?, message = ?, type = ?, priority = ?, recipientType = ?, status = ?, sendEmail = ?, isActive = ? WHERE id = ?';
      const result = await this.executeQuery(query, [title, message, type, priority, recipientType, status, sendEmail, isActive, id]);
      return result;
    } catch (error) {
      console.error('Error in updateNotification:', error);
      throw error;
    }
  }

  async deleteNotification(id) {
    try {
      const query = 'DELETE FROM notifications WHERE id = ?';
      const result = await this.executeQuery(query, [id]);
      return result;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      throw error;
    }
  }

  async clearNotifications() {
    try {
      const query = 'DELETE FROM notifications';
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Error in clearNotifications:', error);
      throw error;
    }
  }

  // Staff operations
  async getStaff(searchTerm = null) {
    let query = 'SELECT id as _id, name, department, email, phone, availability, isActive, createdAt, updatedAt FROM staff';
    const params = [];
    
    // Add search filtering conditions
    if (searchTerm) {
      query += ' WHERE (name LIKE ? OR department LIKE ? OR email LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY name';
    
    try {
      const results = await this.executeQuery(query, params);
      return results;
    } catch (error) {
      console.error('Error in getStaff:', error);
      throw error;
    }
  }

  async getStaffById(id) {
    try {
      const query = 'SELECT id as _id, name, department, email, phone, availability, isActive, createdAt, updatedAt FROM staff WHERE id = ?';
      const rows = await this.executeQuery(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getStaffById:', error);
      throw error;
    }
  }

  async getStaffByName(name) {
    try {
      const query = 'SELECT id as _id, name, department, email, phone, availability, isActive, createdAt, updatedAt FROM staff WHERE name = ?';
      const rows = await this.executeQuery(query, [name]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getStaffByName:', error);
      throw error;
    }
  }

  async createStaff(staff) {
    try {
      const { name, department, email, phone, availability, isActive } = staff;
      const query = 'INSERT INTO staff (name, department, email, phone, availability, isActive) VALUES (?, ?, ?, ?, ?, ?)';
      const result = await this.executeQuery(query, [name, department, email || null, phone || null, availability || null, isActive !== undefined ? isActive : true]);
      return result;
    } catch (error) {
      console.error('Error in createStaff:', error);
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Staff member with this name already exists');
      }
      throw error;
    }
  }

  async createStaffMembers(staffMembers) {
    const results = [];
    
    // Validate input
    if (!Array.isArray(staffMembers) || staffMembers.length === 0) {
      return results;
    }
    
    for (const staff of staffMembers) {
      try {
        // Skip empty rows
        if (!staff.name && !staff.department) {
          results.push({ success: false, error: 'Empty row', staff });
          continue;
        }
        
        // Validate required fields
        if (!staff.name || !staff.department) {
          results.push({ success: false, error: 'Missing required fields: name, department', staff });
          continue;
        }
        
        const result = await this.createStaff(staff);
        results.push({ success: true, result, staff });
      } catch (error) {
        // Handle duplicate entry error specifically
        if (error.code === 'ER_DUP_ENTRY') {
          results.push({ success: false, error: `Staff member ${staff.name} already exists`, staff });
        } else {
          results.push({ success: false, error: error.message, staff });
        }
      }
    }
    return results;
  }

  async updateStaff(id, staff) {
    try {
      const { name, department, email, phone, availability, isActive } = staff;
      const query = 'UPDATE staff SET name = ?, department = ?, email = ?, phone = ?, availability = ?, isActive = ? WHERE id = ?';
      const result = await this.executeQuery(query, [name, department, email || null, phone || null, availability || null, isActive !== undefined ? isActive : true, id]);
      return result;
    } catch (error) {
      console.error('Error in updateStaff:', error);
      throw error;
    }
  }

  async deleteStaff(id) {
    try {
      const query = 'DELETE FROM staff WHERE id = ?';
      const result = await this.executeQuery(query, [id]);
      return result;
    } catch (error) {
      console.error('Error in deleteStaff:', error);
      throw error;
    }
  }

  async clearStaff() {
    try {
      const query = 'DELETE FROM staff';
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Error in clearStaff:', error);
      throw error;
    }
  }

  // Staff Allocations operations
  async getStaffAllocations() {
    try {
      const query = 'SELECT id as _id, allocationData, date, createdAt, updatedAt FROM staff_allocations ORDER BY date DESC';
      const results = await this.executeQuery(query);
      
      // Parse the allocationData JSON strings
      return results.map(allocation => {
        if (typeof allocation.allocationData === 'string') {
          try {
            allocation.allocationData = JSON.parse(allocation.allocationData);
          } catch (parseError) {
            console.error('Error parsing allocationData JSON:', parseError);
          }
        }
        return allocation;
      });
    } catch (error) {
      console.error('Error in getStaffAllocations:', error);
      throw error;
    }
  }

  async getStaffAllocationById(id) {
    try {
      const query = 'SELECT id as _id, allocationData, date, createdAt, updatedAt FROM staff_allocations WHERE id = ?';
      const rows = await this.executeQuery(query, [id]);
      
      if (rows.length > 0) {
        const allocation = rows[0];
        // Parse the allocationData JSON string
        if (typeof allocation.allocationData === 'string') {
          try {
            allocation.allocationData = JSON.parse(allocation.allocationData);
          } catch (parseError) {
            console.error('Error parsing allocationData JSON:', parseError);
          }
        }
        return allocation;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getStaffAllocationById:', error);
      throw error;
    }
  }

  async getStaffAllocationByDate(date) {
    try {
      const query = 'SELECT id as _id, allocationData, date, createdAt, updatedAt FROM staff_allocations WHERE date = ?';
      const rows = await this.executeQuery(query, [date]);
      
      if (rows.length > 0) {
        const allocation = rows[0];
        // Parse the allocationData JSON string
        if (typeof allocation.allocationData === 'string') {
          try {
            allocation.allocationData = JSON.parse(allocation.allocationData);
          } catch (parseError) {
            console.error('Error parsing allocationData JSON:', parseError);
          }
        }
        return allocation;
      }
      
      return null;
    } catch (error) {
      console.error('Error in getStaffAllocationByDate:', error);
      throw error;
    }
  }

  async createStaffAllocation(allocation) {
    try {
      const { allocationData, date } = allocation;
      const query = 'INSERT INTO staff_allocations (allocationData, date) VALUES (?, ?)';
      const result = await this.executeQuery(query, [JSON.stringify(allocationData), date]);
      return result;
    } catch (error) {
      console.error('Error in createStaffAllocation:', error);
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Staff allocation for this date already exists');
      }
      throw error;
    }
  }

  async updateStaffAllocation(id, allocation) {
    try {
      const { allocationData, date } = allocation;
      const query = 'UPDATE staff_allocations SET allocationData = ?, date = ? WHERE id = ?';
      const result = await this.executeQuery(query, [JSON.stringify(allocationData), date, id]);
      return result;
    } catch (error) {
      console.error('Error in updateStaffAllocation:', error);
      throw error;
    }
  }

  async deleteStaffAllocation(id) {
    try {
      const query = 'DELETE FROM staff_allocations WHERE id = ?';
      const result = await this.executeQuery(query, [id]);
      return result;
    } catch (error) {
      console.error('Error in deleteStaffAllocation:', error);
      throw error;
    }
  }

  async clearStaffAllocations() {
    try {
      const query = 'DELETE FROM staff_allocations';
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Error in clearStaffAllocations:', error);
      throw error;
    }
  }

  // Rooms operations
  async getRooms(searchTerm = null) {
    let query = 'SELECT id as _id, number, building, capacity FROM rooms';
    const params = [];
    
    // Add search filtering conditions
    if (searchTerm) {
      query += ' WHERE (number LIKE ? OR building LIKE ?)';
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern);
    }
    
    query += ' ORDER BY building, number';
    
    try {
      const results = await this.executeQuery(query, params);
      return results;
    } catch (error) {
      console.error('Error in getRooms:', error);
      throw error;
    }
  }

  async getRoomById(id) {
    try {
      const query = 'SELECT id as _id, number, building, capacity FROM rooms WHERE id = ?';
      const rows = await this.executeQuery(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getRoomById:', error);
      throw error;
    }
  }

  async getRoomByNumberAndBuilding(number, building) {
    try {
      const query = 'SELECT id as _id, number, building, capacity FROM rooms WHERE number = ? AND building = ?';
      const rows = await this.executeQuery(query, [number, building]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getRoomByNumberAndBuilding:', error);
      throw error;
    }
  }

  async createRoom(room) {
    try {
      const { number, building, capacity } = room;
      const query = 'INSERT INTO rooms (number, building, capacity) VALUES (?, ?, ?)';
      const result = await this.executeQuery(query, [number, building, capacity]);
      return result;
    } catch (error) {
      console.error('Error in createRoom:', error);
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Room with this number and building already exists');
      }
      throw error;
    }
  }

  async createRooms(rooms) {
    const results = [];
    
    // Validate input
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return results;
    }
    
    for (const room of rooms) {
      try {
        // Skip empty rows
        if (!room.number && !room.building) {
          results.push({ success: false, error: 'Empty row', room });
          continue;
        }
        
        // Validate required fields
        if (!room.number || !room.building || !room.capacity) {
          results.push({ success: false, error: 'Missing required fields: number, building, capacity', room });
          continue;
        }
        
        const result = await this.createRoom(room);
        results.push({ success: true, result, room });
      } catch (error) {
        // Handle duplicate entry error specifically
        if (error.code === 'ER_DUP_ENTRY') {
          results.push({ success: false, error: `Room ${room.number} in ${room.building} already exists`, room });
        } else {
          results.push({ success: false, error: error.message, room });
        }
      }
    }
    return results;
  }

  async updateRoom(id, room) {
    try {
      const { number, building, capacity } = room;
      const query = 'UPDATE rooms SET number = ?, building = ?, capacity = ? WHERE id = ?';
      const result = await this.executeQuery(query, [number, building, capacity, id]);
      return result;
    } catch (error) {
      console.error('Error in updateRoom:', error);
      throw error;
    }
  }

  async deleteRoom(id) {
    try {
      const query = 'DELETE FROM rooms WHERE id = ?';
      const result = await this.executeQuery(query, [id]);
      return result;
    } catch (error) {
      console.error('Error in deleteRoom:', error);
      throw error;
    }
  }

  async clearRooms() {
    try {
      const query = 'DELETE FROM rooms';
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Error in clearRooms:', error);
      throw error;
    }
  }

  // Results operations
  async getResults(searchTerm = null, examCodeFilter = null, sectionFilter = null) {
    let query = `
      SELECT 
        r.id as _id, 
        r.studentId, 
        r.examCode, 
        r.subject, 
        r.marksObtained, 
        r.totalMarks, 
        r.grade, 
        r.remarks, 
        r.examDate,
        s.rollNo,
        s.name as studentName,
        s.section
      FROM results r
      JOIN students s ON r.studentId = s.id
    `;
    
    const params = [];
    const conditions = [];
    
    // Add filtering conditions
    if (searchTerm) {
      conditions.push('(s.rollNo LIKE ? OR s.name LIKE ? OR r.subject LIKE ?)');
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (examCodeFilter) {
      conditions.push('r.examCode = ?');
      params.push(examCodeFilter);
    }
    
    if (sectionFilter) {
      conditions.push('s.section = ?');
      params.push(sectionFilter);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY r.examDate DESC, s.rollNo';
    
    try {
      const results = await this.executeQuery(query, params);
      return results;
    } catch (error) {
      console.error('Error in getResults:', error);
      throw error;
    }
  }

  async getResultById(id) {
    try {
      const query = `
        SELECT 
          r.id as _id, 
          r.studentId, 
          r.examCode, 
          r.subject, 
          r.marksObtained, 
          r.totalMarks, 
          r.grade, 
          r.remarks, 
          r.examDate,
          s.rollNo,
          s.name as studentName,
          s.section
        FROM results r
        JOIN students s ON r.studentId = s.id
        WHERE r.id = ?
      `;
      const rows = await this.executeQuery(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getResultById:', error);
      throw error;
    }
  }

  async getResultByStudentIdAndExamCode(studentId, examCode) {
    try {
      const query = `
        SELECT 
          r.id as _id, 
          r.studentId, 
          r.examCode, 
          r.subject, 
          r.marksObtained, 
          r.totalMarks, 
          r.grade, 
          r.remarks, 
          r.examDate,
          s.rollNo,
          s.name as studentName,
          s.section
        FROM results r
        JOIN students s ON r.studentId = s.id
        WHERE r.studentId = ? AND r.examCode = ?
      `;
      const rows = await this.executeQuery(query, [studentId, examCode]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getResultByStudentIdAndExamCode:', error);
      throw error;
    }
  }

  async createResult(result) {
    try {
      const { studentId, examCode, subject, marksObtained, totalMarks, grade, remarks, examDate } = result;
      
      // Check if result already exists for this student and exam
      const existingResult = await this.getResultByStudentIdAndExamCode(studentId, examCode);
      if (existingResult) {
        throw new Error('Result for this student and exam already exists');
      }
      
      const query = `
        INSERT INTO results 
        (studentId, examCode, subject, marksObtained, totalMarks, grade, remarks, examDate) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const resultObj = await this.executeQuery(query, [
        studentId, 
        examCode, 
        subject, 
        marksObtained !== undefined && marksObtained !== null ? marksObtained : null, 
        totalMarks, 
        grade || null, 
        remarks || null, 
        examDate || null
      ]);
      return resultObj;
    } catch (error) {
      console.error('Error in createResult:', error);
      // Handle duplicate entry error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Result for this student and exam already exists');
      }
      throw error;
    }
  }

  async updateResult(id, result) {
    try {
      const { studentId, examCode, subject, marksObtained, totalMarks, grade, remarks, examDate } = result;
      const query = `
        UPDATE results SET 
          studentId = ?, 
          examCode = ?, 
          subject = ?, 
          marksObtained = ?, 
          totalMarks = ?, 
          grade = ?, 
          remarks = ?, 
          examDate = ? 
        WHERE id = ?
      `;
      const resultObj = await this.executeQuery(query, [
        studentId, 
        examCode, 
        subject, 
        marksObtained !== undefined && marksObtained !== null ? marksObtained : null, 
        totalMarks, 
        grade || null, 
        remarks || null, 
        examDate || null,
        id
      ]);
      return resultObj;
    } catch (error) {
      console.error('Error in updateResult:', error);
      throw error;
    }
  }

  async deleteResult(id) {
    try {
      const query = 'DELETE FROM results WHERE id = ?';
      const result = await this.executeQuery(query, [id]);
      return result;
    } catch (error) {
      console.error('Error in deleteResult:', error);
      throw error;
    }
  }

  async clearResults() {
    try {
      const query = 'DELETE FROM results';
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Error in clearResults:', error);
      throw error;
    }
  }

  // Attendance operations
  async getAttendance(searchTerm = null, dateFilter = null, subjectFilter = null, sectionFilter = null) {
    let query = `
      SELECT 
        a.id as _id, 
        a.date, 
        a.subject, 
        a.studentId, 
        a.status, 
        a.notes,
        s.rollNo,
        s.name as studentName,
        s.section
      FROM attendance a
      JOIN students s ON a.studentId = s.id
    `;
    
    const params = [];
    const conditions = [];
    
    // Add filtering conditions
    if (searchTerm) {
      conditions.push('(s.rollNo LIKE ? OR s.name LIKE ? OR a.subject LIKE ?)');
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (dateFilter) {
      conditions.push('a.date = ?');
      params.push(dateFilter);
    }
    
    if (subjectFilter) {
      conditions.push('a.subject = ?');
      params.push(subjectFilter);
    }
    
    if (sectionFilter) {
      conditions.push('s.section = ?');
      params.push(sectionFilter);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY a.date DESC, s.rollNo';
    
    try {
      const results = await this.executeQuery(query, params);
      return results;
    } catch (error) {
      console.error('Error in getAttendance:', error);
      throw error;
    }
  }

  async getAttendanceById(id) {
    try {
      const query = `
        SELECT 
          a.id as _id, 
          a.date, 
          a.subject, 
          a.studentId, 
          a.status, 
          a.notes,
          s.rollNo,
          s.name as studentName,
          s.section
        FROM attendance a
        JOIN students s ON a.studentId = s.id
        WHERE a.id = ?
      `;
      const rows = await this.executeQuery(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error in getAttendanceById:', error);
      throw error;
    }
  }

  async createAttendance(attendance) {
    try {
      const { date, subject, studentId, status, notes } = attendance;
      
      const query = `
        INSERT INTO attendance 
        (date, subject, studentId, status, notes) 
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = await this.executeQuery(query, [
        date, 
        subject, 
        studentId, 
        status, 
        notes || null
      ]);
      return result;
    } catch (error) {
      console.error('Error in createAttendance:', error);
      throw error;
    }
  }

  async updateAttendance(id, attendance) {
    try {
      const { date, subject, studentId, status, notes } = attendance;
      const query = `
        UPDATE attendance SET 
          date = ?, 
          subject = ?, 
          studentId = ?, 
          status = ?, 
          notes = ? 
        WHERE id = ?
      `;
      const result = await this.executeQuery(query, [
        date, 
        subject, 
        studentId, 
        status, 
        notes || null,
        id
      ]);
      return result;
    } catch (error) {
      console.error('Error in updateAttendance:', error);
      throw error;
    }
  }

  async deleteAttendance(id) {
    try {
      const query = 'DELETE FROM attendance WHERE id = ?';
      const result = await this.executeQuery(query, [id]);
      return result;
    } catch (error) {
      console.error('Error in deleteAttendance:', error);
      throw error;
    }
  }

  async clearAttendance() {
    try {
      const query = 'DELETE FROM attendance';
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      console.error('Error in clearAttendance:', error);
      throw error;
    }
  }

}

module.exports = new DatabaseService();