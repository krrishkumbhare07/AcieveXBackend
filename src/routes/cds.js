const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Helper function to read JSON files
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

// Helper function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper function to extract questions from data
function extractQuestions(data) {
  if (Array.isArray(data)) {
    return data;
  } else if (typeof data === 'object') {
    // If data is an object, try to find questions array
    for (const key in data) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
  }
  return [];
}

// Helper function to get subject filename
function getSubjectFilename(year, exam, subject) {
  const examPart = exam === 'CDS I' ? 'I' : 'II';
  return `UPSC_CDS_${year}_${examPart}_${subject}_QP.json`;
}

// GET /api/cds
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    endpoints: {
      '/pyqs': 'Get CDS Previous Year Questions by year and exam',
      '/general-studies': {
        'economy': 'Get CDS General Studies Economy questions',
        'general-knowledge': 'Get CDS General Studies General Knowledge questions',
        'geography': 'Get CDS General Studies Geography questions',
        'history': 'Get CDS General Studies History questions',
        'polity': 'Get CDS General Studies Polity questions'
      },
      '/science': {
        'biology': 'Get CDS Science Biology questions',
        'chemistry': 'Get CDS Science Chemistry questions',
        'physics': 'Get CDS Science Physics questions'
      },
      '/mathematics': 'Get 100 random CDS Mathematics questions',
      '/english': 'Get random CDS English questions from any year'
    }
  });
});

// General Studies Routes
const generalStudiesSubjects = {
  'economy': '2024-General Studies-economy.json',
  'general-knowledge': '2024-General Studies-general-knowledge.json',
  'geography': '2024-General Studies-geography.json',
  'history': '2024-General Studies-history.json',
  'polity': '2024-General Studies-polity.json'
};

// Science Routes
const scienceSubjects = {
  'biology': 'Biology.json',
  'chemistry': 'Chemistry.json',
  'physics': 'Physics.json'
};

// GET /api/cds/general-studies/:subject
router.get('/general-studies/:subject', async (req, res, next) => {
  try {
    const { subject } = req.params;
    if (!generalStudiesSubjects[subject]) {
      return res.status(404).json({
        status: 'error',
        message: 'Subject not found'
      });
    }

    const gsDir = path.join(process.cwd(), 'CDS General Studies');
    const filePath = path.join(gsDir, generalStudiesSubjects[subject]);
    const data = await readJsonFile(filePath);
    const questions = extractQuestions(data);

    res.json({
      status: 'success',
      subject: subject,
      totalQuestions: questions.length,
      data: questions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cds/science/:subject
router.get('/science/:subject', async (req, res, next) => {
  try {
    const { subject } = req.params;
    if (!scienceSubjects[subject]) {
      return res.status(404).json({
        status: 'error',
        message: 'Subject not found'
      });
    }

    const scienceDir = path.join(process.cwd(), 'CDS Science Chapter Wise');
    const filePath = path.join(scienceDir, scienceSubjects[subject]);
    const data = await readJsonFile(filePath);
    const questions = extractQuestions(data);

    res.json({
      status: 'success',
      subject: subject,
      totalQuestions: questions.length,
      data: questions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cds/pyqs
router.get('/pyqs', async (req, res, next) => {
  try {
    const pyqsDir = path.join(process.cwd(), 'CDS PYQs');
    const years = await fs.readdir(pyqsDir);
    const structure = {};

    for (const year of years) {
      const yearPath = path.join(pyqsDir, year);
      const yearStat = await fs.stat(yearPath);
      
      if (yearStat.isDirectory() && year.match(/^\d{4}$/)) {
        structure[year] = {};
        const exams = await fs.readdir(yearPath);
        
        for (const exam of exams) {
          if (exam === 'CDS I' || exam === 'CDS II') {
            const examPath = path.join(yearPath, exam);
            const examStat = await fs.stat(examPath);
            
            if (examStat.isDirectory()) {
              structure[year][exam] = [];
              const files = await fs.readdir(examPath);
              
              for (const file of files) {
                if (file.endsWith('.json')) {
                  // Extract subject from filename
                  const subject = file.split('_')[4].replace('_QP.json', '');
                  structure[year][exam].push(subject);
                }
              }
            }
          }
        }
      }
    }

    res.json({
      status: 'success',
      data: structure
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cds/pyqs/:year/:exam/:subject
router.get('/pyqs/:year/:exam/:subject', async (req, res, next) => {
  try {
    const { year, exam, subject } = req.params;
    const formattedExam = exam === 'I' ? 'CDS I' : 'CDS II';
    const fileName = getSubjectFilename(year, formattedExam, subject);
    const filePath = path.join(process.cwd(), 'CDS PYQs', year, formattedExam, fileName);
    const data = await readJsonFile(filePath);

    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cds/mathematics
router.get('/mathematics', async (req, res, next) => {
  try {
    const mathsDir = path.join(process.cwd(), 'CDS_MATHS_PYQs');
    const files = await fs.readdir(mathsDir);
    let allQuestions = [];

    // Collect all questions from all files
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await readJsonFile(path.join(mathsDir, file));
        const questions = extractQuestions(data);
        allQuestions = allQuestions.concat(questions);
      }
    }

    // Shuffle and limit to 100 questions
    const shuffledQuestions = shuffleArray(allQuestions);
    const limitedQuestions = shuffledQuestions.slice(0, 100);

    res.json({
      status: 'success',
      totalQuestions: allQuestions.length,
      returnedQuestions: limitedQuestions.length,
      data: limitedQuestions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/cds/english
router.get('/english', async (req, res, next) => {
  try {
    const pyqsDir = path.join(process.cwd(), 'CDS PYQs');
    const years = await fs.readdir(pyqsDir);
    const validYears = years.filter(year => year.match(/^\d{4}$/));
    
    // Randomly select a year
    const randomYear = validYears[Math.floor(Math.random() * validYears.length)];
    const yearPath = path.join(pyqsDir, randomYear);
    
    // Get all exams (CDS I/II) for that year
    const exams = await fs.readdir(yearPath);
    const validExams = exams.filter(exam => exam === 'CDS I' || exam === 'CDS II');
    const randomExam = validExams[Math.floor(Math.random() * validExams.length)];
    
    // Read the English file for the selected year and exam
    const fileName = getSubjectFilename(randomYear, randomExam, 'English');
    const englishFile = path.join(yearPath, randomExam, fileName);
    const data = await readJsonFile(englishFile);

    res.json({
      status: 'success',
      year: randomYear,
      exam: randomExam,
      data: data
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 