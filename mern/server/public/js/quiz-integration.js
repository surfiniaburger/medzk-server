// Quiz state management
let quizActive = false;
let questions = [];
let currentCard = 1;

// Default questions if AI generation fails
const FALLBACK_QUESTIONS = [
    {
        question: "What is the recommended daily folic acid intake for pregnant women?",
        options: ["400 micrograms daily", "100 micrograms daily", "800 micrograms daily", "200 micrograms daily"],
        answer: "400 micrograms daily"
    },
    {
        question: "Which trimester typically has the highest energy levels for most pregnant women?",
        options: ["First Trimester", "Second Trimester", "Third Trimester", "Energy levels remain constant"],
        answer: "Second Trimester"
    },
    {
        question: "What is the recommended weight gain during pregnancy for women with normal BMI?",
        options: ["11-15 kg", "5-9 kg", "20-25 kg", "25-30 kg"],
        answer: "11-15 kg"
    }
];

// Function to parse quiz data from AI response
function parseQuizData(data) {
    const questions = [];
    const lines = data.split('\n').filter(line => line.trim() !== '');
    let currentQuestion = null;

    for (const line of lines) {
        const cleanLine = line.replace(/\*\*/g, '').trim();
        
        if (cleanLine.match(/^\d+\.|Question:/i)) {
            if (currentQuestion && currentQuestion.options.length > 0) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                question: cleanLine.replace(/^\d+\.|Question:/i, '').trim(),
                options: [],
                answer: null
            };
        } else if (cleanLine.match(/^[a-d]\)/i) && currentQuestion) {
            const option = cleanLine.replace(/^[a-d]\)/i, '').trim();
            currentQuestion.options.push(option);
        } else if (cleanLine.toLowerCase().startsWith('answer:') && currentQuestion) {
            const answerText = cleanLine.replace(/^answer:/i, '').trim();
            const answerLetter = answerText.match(/^[a-d]\)/i)?.[0];
            
            if (answerLetter && currentQuestion.options.length >= answerLetter.charCodeAt(0) - 96) {
                currentQuestion.answer = currentQuestion.options[answerLetter.charCodeAt(0) - 97];
            } else {
                currentQuestion.answer = currentQuestion.options[0];
            }
        }
    }

    if (currentQuestion && currentQuestion.options.length > 0) {
        questions.push(currentQuestion);
    }

    return questions.slice(0, 3);
}

// Function to create quiz modal
function createQuizModal() {
    const modal = document.createElement('div');
    modal.id = 'quiz-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        justify-content: center;
        align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 600px;
        width: 90%;
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
        padding: 5px;
    `;
    closeButton.onclick = () => modal.style.display = 'none';

    const quizContainer = document.createElement('div');
    quizContainer.id = 'quiz-container';

    modalContent.appendChild(closeButton);
    modalContent.appendChild(quizContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Function to create quiz cards
function createQuizCards() {
    const container = document.getElementById("quiz-container");
    if (!container) return;
    
    container.innerHTML = '';
    
    const totalQuestions = Math.min(questions.length, 3);
    
    for (let index = 0; index < totalQuestions; index++) {
        const q = questions[index];
        const card = document.createElement("div");
        card.id = `card${index + 1}`;
        card.className = `card ${index === 0 ? 'active' : ''}`;
        
        const correctAnswerIndex = q.options.findIndex(option => 
            option.toLowerCase() === q.answer.toLowerCase() ||
            option.toLowerCase().includes(q.answer.toLowerCase()) ||
            q.answer.toLowerCase().includes(option.toLowerCase())
        );
        
        card.innerHTML = `
            <div class="progress">${index + 1}/${totalQuestions}</div>
            <div class="question">${q.question}</div>
            <div class="options">
                ${q.options.map((option, i) => `
                    <div class="option" data-correct="${i === correctAnswerIndex}">${option}</div>
                `).join('')}
            </div>
            <div class="result"></div>
            <div class="navigation">
                <button class="nav-button prev-btn" ${index === 0 ? 'disabled' : ''}>Previous</button>
                <button class="nav-button next-btn" ${index === totalQuestions - 1 ? 'disabled' : ''}>Next</button>
            </div>
        `;
        
        container.appendChild(card);
    }

    // Add event listeners
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', handleAnswer);
    });

    document.querySelectorAll('.prev-btn').forEach(button => {
        button.addEventListener('click', () => showCard(currentCard - 1));
    });

    document.querySelectorAll('.next-btn').forEach(button => {
        button.addEventListener('click', () => showCard(currentCard + 1));
    });
}

// Function to handle answers
function handleAnswer(event) {
    const option = event.target;
    const card = option.closest('.card');
    const result = card.querySelector('.result');
    const nextButton = card.querySelector('.next-btn');
    
    if (card.querySelector('.option.correct') || card.querySelector('.option.wrong')) {
        return;
    }
    
    const isCorrect = option.getAttribute('data-correct') === 'true';
    
    if (isCorrect) {
        option.classList.add('correct');
        result.textContent = '😊 Correct!';
    } else {
        option.classList.add('wrong');
        card.querySelector('[data-correct="true"]').classList.add('correct');
        result.textContent = '😔 Incorrect';
    }
    
    nextButton.disabled = false;
}

// Function to show specific card
function showCard(cardNumber) {
    if (cardNumber < 1 || cardNumber > questions.length) return;
    
    currentCard = cardNumber;
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => card.classList.remove('active'));
    
    const nextCard = document.getElementById(`card${cardNumber}`);
    if (nextCard) {
        nextCard.classList.add('active');
    }
}

// Function to start the quiz
async function startQuiz() {
    if (!document.getElementById('quiz-modal')) {
        createQuizModal();
    }

    // Use fallback questions for now since AI integration is not available
    questions = FALLBACK_QUESTIONS;
    currentCard = 1;
    
    // Add quiz styles if not already present
    if (!document.getElementById('quiz-styles')) {
        const styles = document.createElement('style');
        styles.id = 'quiz-styles';
        styles.textContent = `
            .card {
                display: none;
                margin-bottom: 20px;
            }
            .card.active {
                display: block;
            }
            .question {
                font-size: 1.2rem;
                margin-bottom: 20px;
                color: #333;
            }
            .options {
                display: grid;
                gap: 10px;
            }
            .option {
                padding: 15px 20px;
                border: 2px solid #f8d7e3;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
            }
            .option:hover {
                background: #f8d7e3;
            }
            .option.correct {
                background: #4CAF50;
                color: white;
                border-color: #4CAF50;
            }
            .option.wrong {
                background: #f44336;
                color: white;
                border-color: #f44336;
            }
            .navigation {
                margin-top: 20px;
                display: flex;
                justify-content: space-between;
            }
            .nav-button {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                background: #ff97b7;
                color: white;
                cursor: pointer;
                transition: opacity 0.3s;
            }
            .nav-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .result {
                font-size: 1.2rem;
                text-align: center;
                margin-top: 15px;
            }
            .progress {
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 0.9rem;
                color: #666;
            }
        `;
        document.head.appendChild(styles);
    }

    createQuizCards();
    
    const modal = document.getElementById('quiz-modal');
    modal.style.display = 'flex';
}

// Override the original completeTask function
const originalCompleteTask = window.completeTask;
window.completeTask = function(placeId) {
    if (originalCompleteTask) {
        originalCompleteTask(placeId);
    }
    startQuiz();
};