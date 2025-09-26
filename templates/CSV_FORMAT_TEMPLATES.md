# CSV Format Templates

This document provides the required CSV format templates for importing data into the AICN Examination Management System.

## 1. Students Template

**File Name:** `students-template.csv`

**Format:**
```csv
rollNo,name,section,email,phone
S001,John Smith,A,john.smith@student.edu,+1234567890
S002,Jane Doe,A,jane.doe@student.edu,+1234567891
S003,Robert Johnson,B,robert.johnson@student.edu,+1234567892
```

**Field Descriptions:**
- `rollNo`: Unique student roll number (required)
- `name`: Student's full name (required)
- `section`: Student's section (e.g., A, B, C) (required)
- `email`: Student's email address (optional)
- `phone`: Student's phone number (optional)

## 2. Rooms Template

**File Name:** `rooms-template.csv`

**Format:**
```csv
number,building,capacity
101,Main Building,30
102,Main Building,25
103,Main Building,35
201,Science Block,40
```

**Field Descriptions:**
- `number`: Room number (required)
- `building`: Building name (required)
- `capacity`: Maximum number of students the room can accommodate (required)

## 3. Timetable Template

**File Name:** `timetable-template.csv`

**Format:**
```csv
code,subject,date,time,status
TT001,Mathematics,2025-10-15,10:00-12:00,Scheduled
TT002,Physics,2025-10-16,14:00-16:00,Scheduled
TT003,Chemistry,2025-10-17,09:00-11:00,Scheduled
```

**Field Descriptions:**
- `code`: Unique exam code (required)
- `subject`: Subject name (required)
- `date`: Exam date in YYYY-MM-DD format (required)
- `time`: Exam time in HH:MM-HH:MM format (required)
- `status`: Exam status (e.g., Scheduled, Completed, Postponed) (required)

## 4. Staff Template

**File Name:** `staff-template.csv`

**Format:**
```csv
name,email,phone,department,availability
Prof. John Smith,john.smith@college.edu,123-456-7890,Mathematics,Yes
Prof. Jane Doe,jane.doe@college.edu,098-765-4321,Physics,No
Dr. Robert Johnson,robert.johnson@college.edu,555-123-4567,Chemistry,Yes
```

**Field Descriptions:**
- `name`: Staff member's full name (required)
- `email`: Staff member's email address (required)
- `phone`: Staff member's phone number (required)
- `department`: Department name (required)
- `availability`: Availability status (Yes/No) (required)

## 5. Notifications Template

**File Name:** `notifications-template.csv`

**Format:**
```csv
title,message,type,priority,recipientType
Exam Schedule Update,"The exam schedule has been updated. Please check your timetable.",info,medium,all
Room Change,"Room 101 is under maintenance. Exams will be held in Room 102.",warning,high,all
```

**Field Descriptions:**
- `title`: Notification title (required)
- `message`: Notification message content (required)
- `type`: Notification type (info, warning, error, success) (required)
- `priority`: Notification priority (low, medium, high) (required)
- `recipientType`: Recipient type (all, students, staff) (required)

## General Guidelines

1. **File Format**: All files must be in CSV (Comma-Separated Values) format
2. **Encoding**: UTF-8 encoding is recommended
3. **Header Row**: The first row must contain the field names as specified above
4. **Required Fields**: Fields marked as "required" must be filled for each record
5. **Date Format**: Use YYYY-MM-DD format for dates
6. **Special Characters**: Avoid using commas in field values. If needed, enclose the value in double quotes
7. **File Naming**: Use the suggested file names for consistency

## Sample Data Files

You can find sample data files in the import/ directory:
- `import/student.csv` - Sample student data
- `import/rooms.csv` - Sample room data
- `import/timetable1.csv` - Sample timetable data
- `import/staff.csv` - Sample staff data

## Import Process

1. Prepare your CSV file following the appropriate template
2. Log in to the admin panel
3. Navigate to the relevant section (Students, Rooms, Timetable, Staff, or Notifications)
4. Click the "Import CSV" button
5. Select your prepared CSV file
6. Review the import results and address any errors

## Troubleshooting

If you encounter issues during import:
1. Ensure all required fields are filled
2. Check that the date format is correct (YYYY-MM-DD)
3. Verify there are no special characters that might interfere with CSV parsing
4. Make sure the file encoding is UTF-8
5. Confirm the header row matches the template exactly