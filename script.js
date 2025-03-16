const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://www.examsnet.com/test/upsc-cds-science-biology-questions-part-2";
const TOTAL_QUESTIONS = 25;
const subject = "Biology_Part2";

// Create subject folder
const folderPath = path.join(__dirname, subject);
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

// JSON file path
const filename = path.join(folderPath, `${subject}.json`);

async function fetchQuestion(questionNumber) {
  try {
    const { data } = await axios.get(`${BASE_URL}/${questionNumber}`);
    const $ = cheerio.load(data);

    // --- Extract Question Text ---
    let question_text = $("div#imagewrap a.h5")
  .clone() // Clone the element to keep its structure
  .find("div.floatright") // Find metadata inside
  .remove() // Remove metadata (like [2019 CDS-II])
  .end() // Go back to the original question element
  .text() // Get the text
  .trim();

    if (!question_text) {
      console.log(`❌ No question text found for question ${questionNumber}`);
    }

    // --- Extract Image URL (if present) ---
    let image_urls = [];
    $("div#imagewrap span.sprite").each((_, element) => {
      const imageStyle = $(element).attr("class"); // Example: "sprite Ucds_2_2014_gk_8"
      if (imageStyle) {
        const imageFilename = imageStyle.split(" ").pop() + ".png"; // Extract last part and assume .png
        const imageUrl = `https://www.examsnet.com/path-to-images/${imageFilename}`; // Modify based on actual website path
        image_urls.push(imageUrl);
      }
    });

    // --- Extract Year & Exam Session ---
    let year = "Unknown";
    let exam_session = "Unknown";

    const metadataText = $("div#imagewrap a.h5 div.floatright").text().trim();
    const match = metadataText.match(/\[(\d{4})\s+CDS-(I+)\]/);
    if (match) {
      year = match[1];
      exam_session = match[2];
    }

    // --- Extract Options ---
    const options = [];
    const optionIds = ["A", "B", "C", "D"];
    $("li.list-group-item label span").each((index, element) => {
      options.push({
        id: optionIds[index] || String(index),
        text: $(element).text().trim(),
        has_image: false,
        image_url: "",
        has_equation: false,
        equation_data: "",
      });
    });

    // --- Extract Correct Answer & Explanation ---
    let correct_option = "";
    let explanation = "";
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html());
        if (jsonData["@type"] === "QAPage" && jsonData.mainEntity?.acceptedAnswer) {
          const answerText = jsonData.mainEntity.acceptedAnswer.text;
          explanation = answerText;

          // Find the correct option
          options.forEach((opt) => {
            if (answerText.toLowerCase().includes(opt.text.toLowerCase())) {
              correct_option = opt.id;
            }
          });
        }
      } catch (error) {
        console.error(`Error parsing JSON-LD for question ${questionNumber}:`, error);
      }
    });

    return {
      exam_type: "UPSC_CDS",
      metadata: {
        question_id: `${year}_${exam_session}_UPSC_CDS_${subject}_${questionNumber}`,
        serial_no: questionNumber.toString(),
        subject,
        topic: "",
        subtopic: "",
        year,
        exam_session,
      },
      content: {
        question_text,
        question_format: "text",
        has_image: image_urls.length > 0,
        image_urls,
        has_equation: false,
        equation_data: "",
        language: "en",
      },
      options,
      solution: {
        correct_option,
        explanation,
        explanation_format: "text",
        has_image: false,
        image_urls: [],
        has_equation: false,
        equation_data: "",
      },
    };
  } catch (error) {
    console.error(`Failed to fetch question ${questionNumber}:`, error.message);
    return null;
  }
}

async function fetchAllQuestions() {
  const questions = [];
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    const questionData = await fetchQuestion(i);
    if (questionData) {
      questions.push(questionData);
    }
  }

  // Write to JSON file
  fs.writeFileSync(filename, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`✅ Successfully saved ${questions.length} questions to ${filename}`);
}

fetchAllQuestions();
