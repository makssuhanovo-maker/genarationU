(function () {
  const flyout = document.querySelector("[data-quiz-flyout]");
  const quizRoot = document.querySelector("[data-quiz-root]");
  const backdrop = document.querySelector("[data-quiz-backdrop]");
  const closeButton = document.querySelector("[data-quiz-close]");
  const openButtons = [...document.querySelectorAll("[data-quiz-open]")];
  const progressBar = document.querySelector("[data-quiz-progress]");
  const counterNode = document.querySelector("[data-quiz-counter]");
  const totalNode = document.querySelector("[data-quiz-total]");
  const scoreNode = document.querySelector("[data-quiz-score]");

  if (!flyout || !quizRoot || openButtons.length === 0) return;

  const state = {
    bank: [],
    questions: [],
    currentIndex: 0,
    score: 0,
    isAnswered: false,
    isOpen: false,
    loadingPromise: null,
    lastTrigger: null
  };

  const shuffle = (items) => {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
  };

  const cloneQuestion = (question) => ({
    ...question,
    options: shuffle(question.options.map((option) => ({ ...option })))
  });

  const updateMeta = () => {
    const total = state.questions.length || state.bank.length || 30;
    const currentPosition = state.questions.length ? Math.min(state.currentIndex + 1, total) : 1;
    const progressValue = state.questions.length
      ? Math.min(((state.currentIndex + 1) / total) * 100, 100)
      : 0;

    counterNode.textContent = String(currentPosition);
    totalNode.textContent = String(total);
    scoreNode.textContent = String(state.score);
    progressBar.style.width = `${progressValue}%`;
  };

  const setFlyoutState = (isOpen) => {
    state.isOpen = isOpen;
    openButtons.forEach((button) => button.setAttribute("aria-expanded", String(isOpen)));

    if (isOpen) {
      flyout.hidden = false;

      requestAnimationFrame(() => {
        flyout.classList.add("is-open");
      });

      return;
    }

    flyout.classList.remove("is-open");

    window.setTimeout(() => {
      if (state.isOpen) return;
      flyout.hidden = true;
    }, 240);
  };

  const renderLoading = () => {
    updateMeta();
    quizRoot.innerHTML = `
      <div class="quiz-panel">
        <div class="quiz-empty-state">
          <strong>Завантажуємо питання…</strong>
          <p>Готуємо для вас міні-тест із політичної грамотності.</p>
        </div>
      </div>
    `;
  };

  const renderError = () => {
    quizRoot.innerHTML = `
      <div class="quiz-panel">
        <div class="quiz-empty-state quiz-empty-state-error">
          <strong>Не вдалося завантажити квіз</strong>
          <p>Оновіть сторінку або спробуйте ще раз через кілька секунд.</p>
          <button class="button button-primary quiz-retry" type="button">Спробувати ще раз</button>
        </div>
      </div>
    `;

    const retryButton = quizRoot.querySelector(".quiz-retry");

    if (retryButton) {
      retryButton.addEventListener("click", async () => {
        await ensureQuizReady(true);
      });
    }
  };

  const getResultTier = (score, total) => {
    if (score === 0) {
      return {
        title: "Ви - Янукович",
        note: "Почнімо з бази: саме час освіжити знання про політичну систему, участь і права громадян."
      };
    }

    if (score === total) {
      return {
        title: "Ви президент",
        note: "Ідеальний результат. Політична грамотність у вас уже на рівні людини, яка підписує закони."
      };
    }

    if (score >= total - 3) {
      return {
        title: "Ви прем'єр-міністр",
        note: "Майже бездоганно. Ви дуже добре орієнтуєтесь у державному устрої та політичних процесах."
      };
    }

    if (score >= 23) {
      return {
        title: "Ви міністр",
        note: "Сильний результат. Видно системне розуміння того, як працюють інституції та політики."
      };
    }

    if (score >= 19) {
      return {
        title: "Ви народний депутат",
        note: "Хороший рівень. Ви вже впевнено тримаєтеся в темах парламенту, участі та законодавчого процесу."
      };
    }

    if (score >= 15) {
      return {
        title: "Ви мер",
        note: "Локальне управління вам явно близьке. Є добра база, яку можна швидко посилити до наступного рівня."
      };
    }

    if (score >= 10) {
      return {
        title: "Ви депутат міської ради",
        note: "Непоганий старт. Уже є орієнтація в темі, але ще є куди рости в державних і муніципальних питаннях."
      };
    }

    if (score >= 5) {
      return {
        title: "Ви голова громади",
        note: "Базове розуміння вже є. Кілька сильних навчальних модулів можуть дуже помітно підняти результат."
      };
    }

    return {
      title: "Ви помічник депутата",
      note: "Ви вже в політичному контексті, але поки що більше на старті. Навчання допоможе швидко розкласти все по поличках."
    };
  };

  const renderResult = () => {
    const tier = getResultTier(state.score, state.questions.length);

    progressBar.style.width = "100%";
    counterNode.textContent = String(state.questions.length);
    scoreNode.textContent = String(state.score);

    quizRoot.innerHTML = `
      <div class="quiz-panel quiz-result">
        <span class="quiz-result-mark">Фініш</span>
        <span class="quiz-result-rank">${tier.title}</span>
        <strong>Ви дали правильних відповідей: ${state.score} з ${state.questions.length}</strong>
        <p>${tier.note}</p>
        <div class="quiz-result-learning">
          <strong>Хочете посилити результат?</strong>
          <p>Долучайтеся до навчання від Покоління Ю та переходьте до наших освітніх курсів.</p>
        </div>
        <div class="quiz-result-actions">
          <a class="button button-secondary quiz-course-link" href="./courses.html">Перейти до курсів</a>
          <button class="button button-primary quiz-restart" type="button">Пройти ще раз</button>
        </div>
      </div>
    `;

    const restartButton = quizRoot.querySelector(".quiz-restart");

    if (restartButton) {
      restartButton.addEventListener("click", startQuiz);
    }
  };

  const goToNextQuestion = () => {
    if (state.currentIndex >= state.questions.length - 1) {
      renderResult();
      return;
    }

    state.currentIndex += 1;
    state.isAnswered = false;
    renderQuestion();
  };

  const handleAnswer = (selectedIndex) => {
    if (state.isAnswered) return;

    state.isAnswered = true;
    const currentQuestion = state.questions[state.currentIndex];
    const optionButtons = [...quizRoot.querySelectorAll(".quiz-option")];
    const correctIndex = currentQuestion.options.findIndex((option) => option.isCorrect);
    const isCorrect = currentQuestion.options[selectedIndex]?.isCorrect;

    optionButtons.forEach((button, index) => {
      button.disabled = true;

      if (index === correctIndex) {
        button.classList.add("is-correct");
      }

      if (index === selectedIndex && !isCorrect) {
        button.classList.add("is-incorrect");
      }
    });

    if (isCorrect) {
      state.score += 1;
      scoreNode.textContent = String(state.score);
    }

    const explanation = currentQuestion.options[correctIndex]?.explanation || "";
    const responseNode = document.createElement("div");
    responseNode.className = "quiz-response";

    const explanationNode = document.createElement("div");
    explanationNode.className = "quiz-explanation";
    explanationNode.textContent = explanation;

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "button button-primary quiz-next";
    nextButton.textContent = state.currentIndex === state.questions.length - 1 ? "Показати результат" : "Наступне питання";
    nextButton.addEventListener("click", goToNextQuestion);

    const panel = quizRoot.querySelector(".quiz-panel");
    responseNode.append(explanationNode, nextButton);
    panel.append(responseNode);
  };

  function renderQuestion() {
    updateMeta();
    const currentQuestion = state.questions[state.currentIndex];

    quizRoot.innerHTML = `
      <div class="quiz-panel">
        <h3 class="quiz-question">${currentQuestion.question}</h3>
        <div class="quiz-options">
          ${currentQuestion.options
            .map(
              (option, index) => `
                <button class="quiz-option" type="button" data-option-index="${index}">
                  ${option.text}
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    `;

    quizRoot.querySelectorAll(".quiz-option").forEach((button) => {
      button.addEventListener("click", () => {
        handleAnswer(Number(button.dataset.optionIndex));
      });
    });
  }

  function startQuiz() {
    state.questions = shuffle(state.bank.map(cloneQuestion));
    state.currentIndex = 0;
    state.score = 0;
    state.isAnswered = false;
    renderQuestion();
  }

  async function loadQuestionBank(forceReload = false) {
    if (state.bank.length && !forceReload) return state.bank;
    if (state.loadingPromise && !forceReload) return state.loadingPromise;

    renderLoading();

    state.loadingPromise = fetch("./content/quiz-politics.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load quiz data: ${response.status}`);
        }

        return response.json();
      })
      .then((payload) => {
        if (!Array.isArray(payload) || payload.length === 0) {
          throw new Error("Quiz payload is empty");
        }

        state.bank = payload;
        totalNode.textContent = String(payload.length);
        return payload;
      })
      .catch((error) => {
        console.error(error);
        renderError();
        throw error;
      })
      .finally(() => {
        state.loadingPromise = null;
      });

    return state.loadingPromise;
  }

  async function ensureQuizReady(forceReload = false) {
    try {
      await loadQuestionBank(forceReload);

      if (!state.questions.length || forceReload) {
        startQuiz();
      } else {
        updateMeta();
      }
    } catch (error) {
      return null;
    }

    return state.questions;
  }

  const openFlyout = async (trigger) => {
    state.lastTrigger = trigger || state.lastTrigger;
    setFlyoutState(true);
    await ensureQuizReady();
  };

  const closeFlyout = () => {
    setFlyoutState(false);

    if (state.lastTrigger) {
      window.setTimeout(() => {
        state.lastTrigger.focus();
      }, 180);
    }
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.isOpen) {
        closeFlyout();
        return;
      }

      await openFlyout(button);
    });
  });

  if (closeButton) {
    closeButton.addEventListener("click", closeFlyout);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeFlyout);
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.isOpen) {
      closeFlyout();
    }
  });
})();
