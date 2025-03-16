const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const BASE_URL =
  "https://www.examsnet.com/fulltest/upsc-cds-gs-history-questions-part-1";
const TOTAL_QUESTIONS = 10;

// Define metadata for file naming
const year = 2024;
const exam_session = "I";
const subject = "GK";
const filename = `${year}-${exam_session}-${subject}.json`;

async function fetchQuestion(questionNumber) {
  const url = `${BASE_URL}${questionNumber}`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // --- Extract Metadata ---
    const exam_type = "UPSC_CDS";
    const question_id = `${year}_${exam_session}_${exam_type}_${subject}_${questionNumber}`;

    // --- Extract Question Text ---
    let question_text = $(".question-text").text().trim();
    if (!question_text) {
      question_text = $("article").text().trim(); // Fallback in case question text is in an <article> tag
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
        if (
          jsonData["@type"] === "QAPage" &&
          jsonData.mainEntity?.acceptedAnswer
        ) {
          const answerText = jsonData.mainEntity.acceptedAnswer.text;
          explanation = answerText; // Use full answer text as explanation

          // Find matching option
          options.forEach((opt) => {
            if (answerText.toLowerCase().includes(opt.text.toLowerCase())) {
              correct_option = opt.id;
            }
          });
        }
      } catch (error) {
        console.error(
          `Error parsing JSON-LD for question ${questionNumber}:`,
          error,
        );
      }
    });

    return {
      exam_type,
      metadata: {
        question_id,
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
        has_image: false,
        image_urls: [],
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
  console.log(
    `✅ Successfully saved ${questions.length} questions to ${filename}`,
  );
}

fetchAllQuestions();
