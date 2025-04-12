const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Helper function to read JSON file
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, { encoding: 'utf8' });
        // Ensure the text is in English by replacing any non-ASCII characters
        const englishData = data.replace(/[^\x00-\x7F]/g, '');
        return JSON.parse(englishData);
    } catch (error) {
        console.error('Error reading file:', filePath);
        console.error('Error details:', error);
        throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
}

// Helper function to get available years
async function getAvailableYears(baseDir) {
    try {
        const years = await fs.readdir(baseDir);
        return years.filter(year => /^\d{4}$/.test(year));
    } catch (error) {
        throw new Error(`Error reading directory ${baseDir}: ${error.message}`);
    }
}

// Helper function to get file path
function getFilePath(baseDir, year, paperType) {
    const filePath = path.join(process.cwd(), baseDir, `${year}_${paperType}.json`);
    console.log('Attempting to read file:', filePath);
    return filePath;
}

// GET /api/upsc
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    endpoints: {
      '/prelims': 'Get UPSC Prelims questions',
      '/mains/gs': 'Get UPSC Mains GS papers',
      '/essays': 'Get UPSC essay topics'
    }
  });
});

// 1. UPSC CSE Prelims Routes

// Get available years and papers
router.get('/prelims', async (req, res) => {
    try {
        const prelimsDir = path.join(process.cwd(), 'UPSC PRELIMS PYQs');
        console.log('Reading directory:', prelimsDir);
        const files = await fs.readdir(prelimsDir);
        console.log('Found files:', files);
        
        const data = {};
        for (const file of files) {
            if (file.endsWith('.json')) {
                const year = file.split('_')[0];
                if (!data[year]) {
                    data[year] = ['General Studies 1', 'General Studies 2'];
                }
            }
        }
        
        res.json({
            status: 'success',
            data
        });
    } catch (error) {
        console.error('Error in /prelims:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get GS Paper 1 questions
router.get('/prelims/gs1/:year', async (req, res) => {
    try {
        const { year } = req.params;
        console.log('Requested year:', year);
        const filePath = getFilePath('UPSC PRELIMS PYQs', year, 'General-Studies_1');
        
        const data = await readJsonFile(filePath);
        const allQuestions = Array.isArray(data) ? data : [];
        const totalQuestions = allQuestions.length;

        if (totalQuestions < 100) {
            return res.status(400).json({
                status: 'error',
                message: 'Not enough questions available',
                details: `Only ${totalQuestions} questions found, minimum 100 required`
            });
        }

        // Create a copy of the array to avoid modifying the original
        const questionsCopy = [...allQuestions];
        const selectedQuestions = [];

        // Select 100 random questions
        for (let i = 0; i < 100; i++) {
            const randomIndex = Math.floor(Math.random() * questionsCopy.length);
            selectedQuestions.push(questionsCopy[randomIndex]);
            questionsCopy.splice(randomIndex, 1); // Remove the selected question to avoid duplicates
        }
        
        res.json({
            status: 'success',
            year,
            paper: 'General Studies 1',
            data: {
                questions: selectedQuestions,
                totalQuestions: totalQuestions
            }
        });
    } catch (error) {
        console.error('Error in /prelims/gs1:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get GS Paper 2 questions
router.get('/prelims/gs2/:year', async (req, res) => {
    try {
        const { year } = req.params;
        console.log('Requested year:', year);
        const filePath = getFilePath('UPSC PRELIMS PYQs', year, 'General-Studies_2');
        
        const data = await readJsonFile(filePath);
        const allQuestions = Array.isArray(data) ? data : [];
        const totalQuestions = allQuestions.length;

        if (totalQuestions < 80) {
            return res.status(400).json({
                status: 'error',
                message: 'Not enough questions available',
                details: `Only ${totalQuestions} questions found, minimum 80 required`
            });
        }

        // Create a copy of the array to avoid modifying the original
        const questionsCopy = [...allQuestions];
        const selectedQuestions = [];

        // Select 80 random questions
        for (let i = 0; i < 80; i++) {
            const randomIndex = Math.floor(Math.random() * questionsCopy.length);
            selectedQuestions.push(questionsCopy[randomIndex]);
            questionsCopy.splice(randomIndex, 1); // Remove the selected question to avoid duplicates
        }
        
        res.json({
            status: 'success',
            year,
            paper: 'General Studies 2',
            data: {
                questions: selectedQuestions,
                totalQuestions: totalQuestions
            }
        });
    } catch (error) {
        console.error('Error in /prelims/gs2:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 2. UPSC Mains English-Essay Routes

// Get available years
router.get('/mains/essay', async (req, res) => {
    try {
        const essayDir = path.join(process.cwd(), 'UPSC_Essays');
        console.log('Reading essay directory:', essayDir);
        
        // Check if directory exists
        try {
            await fs.access(essayDir);
            console.log('Directory exists:', essayDir);
        } catch (error) {
            console.error('Directory does not exist:', essayDir);
            return res.status(404).json({
                status: 'error',
                message: 'Essay directory not found',
                details: `Directory path: ${essayDir}`
            });
        }
        
        const files = await fs.readdir(essayDir);
        console.log('Found essay files:', files);
        
        if (files.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No essay files found in directory',
                details: `Directory path: ${essayDir}`
            });
        }
        
        const years = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.split('_')[0]);
        
        if (years.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No valid essay files found',
                details: `Directory path: ${essayDir}`
            });
        }
        
        res.json({
            status: 'success',
            data: {
                availableYears: years
            }
        });
    } catch (error) {
        console.error('Error in /mains/essay:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get essay questions by year
router.get('/mains/essay/:year', async (req, res) => {
    try {
        const { year } = req.params;
        console.log('Requested essay year:', year);
        
        const essayDir = path.join(process.cwd(), 'UPSC_Essays');
        console.log('Essay directory:', essayDir);
        
        // Check if directory exists
        try {
            await fs.access(essayDir);
            console.log('Directory exists:', essayDir);
        } catch (error) {
            console.error('Directory does not exist:', essayDir);
            return res.status(404).json({
                status: 'error',
                message: 'Essay directory not found',
                details: `Directory path: ${essayDir}`
            });
        }
        
        const filePath = path.join(essayDir, `${year}_essays.json`);
        console.log('Attempting to read file:', filePath);
        
        // Check if file exists
        try {
            await fs.access(filePath);
            console.log('File exists:', filePath);
        } catch (error) {
            console.error('File does not exist:', filePath);
            return res.status(404).json({
                status: 'error',
                message: `Essay file for year ${year} not found`,
                details: `File path: ${filePath}`
            });
        }
        
        const data = await readJsonFile(filePath);
        console.log('Successfully read file:', filePath);
        
        // Randomly select two essays
        const allEssays = Array.isArray(data) ? data : [];
        const totalEssays = allEssays.length;
        
        if (totalEssays < 2) {
            return res.status(400).json({
                status: 'error',
                message: 'Not enough essays available',
                details: `Only ${totalEssays} essays found`
            });
        }
        
        // Create a copy of the array to avoid modifying the original
        const essaysCopy = [...allEssays];
        const selectedEssays = [];
        
        // Select two random essays
        for (let i = 0; i < 2; i++) {
            const randomIndex = Math.floor(Math.random() * essaysCopy.length);
            selectedEssays.push(essaysCopy[randomIndex]);
            essaysCopy.splice(randomIndex, 1); // Remove the selected essay to avoid duplicates
        }
        
        res.json({
            status: 'success',
            year,
            data: {
                essays: selectedEssays,
                totalEssays: totalEssays
            }
        });
    } catch (error) {
        console.error('Error in /mains/essay/:year:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 3. UPSC Mains General Studies Routes

// Get available years and papers
router.get('/mains/gs', async (req, res) => {
    try {
        const gsDir = path.join(process.cwd(), 'UPSC_MAINS_CSE_GS_PAPERS');
        const years = await getAvailableYears(gsDir);
        
        const data = {};
        for (const year of years) {
            data[year] = ['Paper 1', 'Paper 2', 'Paper 3', 'Paper 4'];
        }
        
        res.json({
            status: 'success',
            data
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function for GS papers
async function getGSPaper(year, paperNumber) {
    const filePath = path.join(process.cwd(), 'UPSC_MAIN_CSE_GS_PAPERS', `UPSC_MAIN_CSE_GS_${year}_PAPER_${paperNumber}.json`);
    console.log('Attempting to read GS paper:', filePath);
    return await readJsonFile(filePath);
}

// Get GS Paper 1 questions
router.get('/mains/gs/paper1/:year', async (req, res) => {
    try {
        const { year } = req.params;
        console.log('Requested GS Paper 1 for year:', year);
        const data = await getGSPaper(year, 1);
        
        res.json({
            status: 'success',
            year,
            paper: 'General Studies Paper 1',
            data: {
                questions: data
            }
        });
    } catch (error) {
        console.error('Error in /mains/gs/paper1:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get GS Paper 2 questions
router.get('/mains/gs/paper2/:year', async (req, res) => {
    try {
        const { year } = req.params;
        console.log('Requested GS Paper 2 for year:', year);
        const data = await getGSPaper(year, 2);
        
        res.json({
            status: 'success',
            year,
            paper: 'General Studies Paper 2',
            data: {
                questions: data
            }
        });
    } catch (error) {
        console.error('Error in /mains/gs/paper2:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get GS Paper 3 questions
router.get('/mains/gs/paper3/:year', async (req, res) => {
    try {
        const { year } = req.params;
        console.log('Requested GS Paper 3 for year:', year);
        const data = await getGSPaper(year, 3);
        
        res.json({
            status: 'success',
            year,
            paper: 'General Studies Paper 3',
            data: {
                questions: data
            }
        });
    } catch (error) {
        console.error('Error in /mains/gs/paper3:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get GS Paper 4 questions
router.get('/mains/gs/paper4/:year', async (req, res) => {
    try {
        const { year } = req.params;
        console.log('Requested GS Paper 4 for year:', year);
        const data = await getGSPaper(year, 4);
        
        res.json({
            status: 'success',
            year,
            paper: 'General Studies Paper 4',
            data: {
                questions: data
            }
        });
    } catch (error) {
        console.error('Error in /mains/gs/paper4:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Helper function to get random questions
async function getRandomQuestions(filePath, count) {
    const data = await readJsonFile(filePath);
    const allQuestions = Array.isArray(data) ? data : [];
    const totalQuestions = allQuestions.length;

    if (totalQuestions < count) {
        throw new Error(`Not enough questions available. Only ${totalQuestions} questions found, minimum ${count} required`);
    }

    const questionsCopy = [...allQuestions];
    const selectedQuestions = [];

    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * questionsCopy.length);
        selectedQuestions.push(questionsCopy[randomIndex]);
        questionsCopy.splice(randomIndex, 1);
    }

    return {
        questions: selectedQuestions,
        totalQuestions: totalQuestions
    };
}

// 4. UPSC CSE Chapter-wise General Studies Routes

// Prelims Chapter-wise Routes
router.get('/prelims/chapter-wise/social-issues', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_SocialIssues.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Social Issues',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/social-issues:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/science-and-technology', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_ScienceAndTechnology.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Science and Technology',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/science-and-technology:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/security-issues', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_SecurityIssues.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Security Issues',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/security-issues:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/international-relations', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_InternationalRelations.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'International Relations',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/international-relations:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/indian-polity', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_IndianPolityAndGovernance.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Indian Polity and Governance',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/indian-polity:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/history-and-culture', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_HistoryAndCulture.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'History and Culture',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/history-and-culture:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/health-and-education', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_HealthAndEducation.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Health and Education',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/health-and-education:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/geography-and-environment', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_GeographyAndEnvironment.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Geography and Environment',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/geography-and-environment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/ethics-and-governance', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_EthicsAndGovernance.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Ethics and Governance',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/ethics-and-governance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/prelims/chapter-wise/economy-and-development', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Prelims_General_Studies_EconomyAndDevelopment.json');
        const result = await getRandomQuestions(filePath, 50);
        
        res.json({
            status: 'success',
            category: 'Prelims',
            subject: 'Economy and Development',
            data: result
        });
    } catch (error) {
        console.error('Error in /prelims/chapter-wise/economy-and-development:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Mains Chapter-wise Routes
router.get('/mains/chapter-wise/social-issues', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_SocialIssues.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'Social Issues',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/social-issues:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/mains/chapter-wise/science-and-technology', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_ScienceAndTechnology.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'Science and Technology',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/science-and-technology:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// router.get('/mains/chapter-wise/security-issues', async (req, res) => {
//     try {
//         const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_SecurityIssues.json');
//         const result = await getRandomQuestions(filePath, 10);
        
//         res.json({
//             status: 'success',
//             category: 'Mains',
//             subject: 'Security Issues',
//             data: result
//         });
//     } catch (error) {
//         console.error('Error in /mains/chapter-wise/security-issues:', error);
//         res.status(500).json({
//             status: 'error',
//             message: 'Something went wrong!',
//             error: process.env.NODE_ENV === 'development' ? error.message : undefined,
//             details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// });

router.get('/mains/chapter-wise/international-relations', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_InternationalRelations.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'International Relations',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/international-relations:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/mains/chapter-wise/indian-polity', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_IndianPolityAndGovernance.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'Indian Polity and Governance',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/indian-polity:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/mains/chapter-wise/history-and-culture', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_HistoryAndCulture.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'History and Culture',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/history-and-culture:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/mains/chapter-wise/geography-and-environment', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_GeographyAndEnvironment.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'Geography and Environment',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/geography-and-environment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/mains/chapter-wise/health-and-education', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_HealthAndEducation.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'Health and Education',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/health-and-education:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/mains/chapter-wise/ethics-and-governance', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_EthicsAndGovernance.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'Ethics and Governance',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/ethics-and-governance:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.get('/mains/chapter-wise/economy-and-development', async (req, res) => {
    try {
        const filePath = path.join(process.cwd(), 'CSE_General_Studies_Chapter_Wise', 'Mains_General_Studies_EconomyAndDevelopment.json');
        const result = await getRandomQuestions(filePath, 10);
        
        res.json({
            status: 'success',
            category: 'Mains',
            subject: 'Economy and Development',
            data: result
        });
    } catch (error) {
        console.error('Error in /mains/chapter-wise/economy-and-development:', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router; 