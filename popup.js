/**
 * QA Daily Quiz Popup Script
 * Fetches questions from Google Sheets, handles category selection with localStorage,
 * and displays random questions with a loading spinner.
 */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0BpOl-XMBbu0oXpEOCBL_QFwluIaS2DxSWq84wbrL3zuYK-LHdz0wlANw092gndDAoQ/exec';
let allQuestions = [];

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const checkboxes = document.querySelectorAll('.category-checkbox');
  const showAnswerBtn = document.getElementById('show-answer-btn');
  const nextQuestionBtn = document.getElementById('next-question-btn');
  const questionText = document.getElementById('question-text');
  const answerText = document.getElementById('answer-text');
  const loadingSpinner = document.getElementById('loading-spinner');

  // Initialize UI: Hide buttons until a question loads
  showAnswerBtn.classList.add('hidden');
  nextQuestionBtn.classList.add('hidden');

  // Load saved categories from localStorage, default to ['Cypress']
  let savedCategories = JSON.parse(localStorage.getItem('selectedCategories'));
  if (!savedCategories || savedCategories.length === 0) {
    savedCategories = ['Cypress'];
    localStorage.setItem('selectedCategories', JSON.stringify(savedCategories));
  }

  // Apply saved or default checkbox states
  checkboxes.forEach(checkbox => {
    checkbox.checked = savedCategories.includes(checkbox.value);
    checkbox.addEventListener('change', saveCategorySelections);
  });

  /**
   * Saves selected categories to localStorage and refreshes questions.
   */
  function saveCategorySelections() {
    const selectedCategories = Array.from(checkboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);
    localStorage.setItem('selectedCategories', JSON.stringify(selectedCategories));
    fetchQuestion();
  }

  /**
   * Fetches questions for selected categories and displays one.
   */
  function fetchQuestion() {
    const selectedCategories = Array.from(checkboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);

    if (selectedCategories.length === 0) {
      questionText.textContent = 'Please select at least one category.';
      answerText.classList.add('hidden');
      showAnswerBtn.classList.add('hidden');
      nextQuestionBtn.classList.add('hidden');
      loadingSpinner.classList.add('hidden');
      return;
    }

    fetchQuestions(selectedCategories);
  }

  /**
   * Fetches questions from Google Apps Script for given categories.
   * @param {string[]} categories - Array of selected category names.
   */
  async function fetchQuestions(categories) {
    allQuestions = [];
    toggleLoading(true);
    showAnswerBtn.classList.add('hidden');
    nextQuestionBtn.classList.add('hidden');

    for (const category of categories) {
      try {
        const response = await fetch(`${APPS_SCRIPT_URL}?category=${encodeURIComponent(category)}`);
        if (!response.ok) {
          console.error(`Error fetching ${category}. Status: ${response.status}`);
          continue;
        }
        const newQuestions = await response.json();
        if (Array.isArray(newQuestions)) {
          allQuestions.push(...newQuestions);
        } else {
          console.error(`Invalid data for category: ${category}`);
        }
      } catch (error) {
        console.error(`Fetch error for ${category}:`, error);
      }
    }

    shuffleArray(allQuestions); // Shuffle questions for randomness
    toggleLoading(false);
    displayNextQuestion();
  }

  /**
   * Toggles the loading spinner visibility.
   * @param {boolean} isLoading - Whether to show or hide the spinner.
   */
  function toggleLoading(isLoading) {
    if (isLoading) {
      loadingSpinner.classList.remove('hidden');
      questionText.textContent = '';
    } else {
      loadingSpinner.classList.add('hidden');
    }
  }

  /**
   * Displays a random question from the fetched pool.
   */
  function displayNextQuestion() {
    if (allQuestions.length === 0) {
      questionText.textContent = 'Please make sure you are logged into only one Google account in your browser, as the extension will not work correctly with multiple accounts. ';
      answerText.classList.add('hidden');
      showAnswerBtn.classList.add('hidden');
      nextQuestionBtn.classList.add('hidden');
      return;
    }

    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    const questionData = allQuestions[randomIndex];

    questionText.textContent = questionData.question;
    answerText.textContent = questionData.answer;
    answerText.classList.add('hidden');
    showAnswerBtn.classList.remove('hidden');
    nextQuestionBtn.classList.remove('hidden');
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm.
   * @param {Array} array - Array to shuffle.
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Event listeners
  showAnswerBtn.addEventListener('click', () => {
    answerText.classList.toggle('hidden');
  });

  nextQuestionBtn.addEventListener('click', () => {
    answerText.classList.add('hidden');
    displayNextQuestion(); // Use existing pool for faster response
  });

  // Initial question fetch
  fetchQuestion();
});