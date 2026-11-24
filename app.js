const STORAGE_KEY = "habitPulseData";
const INVALID_BACKUP_MESSAGE =
  "Arquivo inválido. Selecione um backup gerado pelo HabitPulse.";
const moodForm = document.querySelector("#mood-form");
const moodFeedback = document.querySelector("#mood-feedback");
const moodHistory = document.querySelector("#mood-history");
const emptyMoods = document.querySelector("#empty-moods");
const emptyMoodFilter = document.querySelector("#empty-mood-filter");
const moodTagFilter = document.querySelector("#mood-tag-filter");
const moodScoreFilter = document.querySelector("#mood-score-filter");
const topTagInsight = document.querySelector("#insight-top-tag");
const habitMoodInsight = document.querySelector("#insight-habit-mood");
const habitForm = document.querySelector("#habit-form");
const habitInput = document.querySelector("#habit-name");
const habitList = document.querySelector("#habit-list");
const emptyHabits = document.querySelector("#empty-habits");
const habitCount = document.querySelector("#habit-count");
const exportBackupButton = document.querySelector("#export-backup");
const importBackupButton = document.querySelector("#import-backup");
const backupFileInput = document.querySelector("#backup-file");
const backupFeedback = document.querySelector("#backup-feedback");
const moodEmojis = ["😞", "🙁", "😐", "🙂", "😄"];
const MOOD_TAGS = [
  "Confuso",
  "Sobrecarregado",
  "Ansioso",
  "Cansado",
  "Reflexivo",
  "Calmo",
  "Focado",
  "Grato",
  "Motivado",
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function normalizeMoodRecord(mood) {
  if (
    !mood ||
    !Number.isInteger(mood.score) ||
    mood.score < 1 ||
    mood.score > 5 ||
    typeof mood.note !== "string" ||
    typeof mood.date !== "string"
  ) {
    return null;
  }

  const tags = Array.isArray(mood.tags)
    ? [...new Set(mood.tags.filter((tag) => MOOD_TAGS.includes(tag)))]
    : [];

  if (/^\d{4}-\d{2}-\d{2}$/.test(mood.date)) {
    if (!isValidDateKey(mood.date)) return null;
    return {
      score: mood.score,
      note: mood.note,
      tags,
      date: mood.date,
      time: /^\d{2}:\d{2}:\d{2}$/.test(mood.time) ? mood.time : "00:00:00",
    };
  }

  const timestamp = new Date(mood.date);
  if (Number.isNaN(timestamp.getTime())) return null;
  return {
    score: mood.score,
    note: mood.note,
    tags,
    date: formatDateKey(timestamp),
    time: formatTime(timestamp),
  };
}

function normalizeHabitRecord(habit) {
  if (
    !habit ||
    typeof habit.name !== "string" ||
    typeof habit.completed !== "boolean"
  ) {
    return null;
  }

  const today = formatDateKey(new Date());
  const completedDates = Array.isArray(habit.completedDates)
    ? [...new Set(
        habit.completedDates.filter(
          (date) => typeof date === "string" && isValidDateKey(date),
        ),
      )]
    : habit.completed
      ? [today]
      : [];

  if (
    Array.isArray(habit.completedDates) &&
    completedDates.length !== habit.completedDates.length
  ) {
    console.error(`Datas de conclusão inválidas no hábito "${habit.name}" foram ignoradas.`);
  }

  return {
    name: habit.name,
    completed: completedDates.includes(today),
    completedDates,
  };
}

function getLastSevenDays(referenceDate = new Date()) {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 6 + index,
    );
    const weekday = new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
    })
      .format(date)
      .replace(/\.$/, "");

    return {
      key: formatDateKey(date),
      label: `${weekday[0].toLocaleUpperCase("pt-BR")}${weekday.slice(1)}`,
    };
  });
}

function getMoodChartData(records, referenceDate = new Date()) {
  const days = getLastSevenDays(referenceDate);

  return {
    labels: days.map((day) => day.label),
    values: days.map((day) => {
      const dailyRecords = records.filter((record) => record.date === day.key);
      if (dailyRecords.length === 0) return null;
      return (
        dailyRecords.reduce((total, record) => total + record.score, 0) /
        dailyRecords.length
      );
    }),
  };
}

function renderWeeklyInsights() {
  const dayKeys = new Set(getLastSevenDays().map((day) => day.key));
  const recentMoods = moods.filter((mood) => dayKeys.has(mood.date));
  const tagCounts = new Map();

  recentMoods.forEach((mood) => {
    mood.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const mostSelectedTag = [...tagCounts.entries()].sort(
    (a, b) => b[1] - a[1] || MOOD_TAGS.indexOf(a[0]) - MOOD_TAGS.indexOf(b[0]),
  )[0];
  topTagInsight.textContent = mostSelectedTag
    ? `${mostSelectedTag[0]} (${mostSelectedTag[1]} ${mostSelectedTag[1] === 1 ? "seleção" : "seleções"})`
    : "Ainda não há tags registradas nesta semana. Adicione uma tag ao seu próximo check-in.";

  const completedDayKeys = new Set(
    habits.flatMap((habit) => habit.completedDates).filter((date) => dayKeys.has(date)),
  );
  const moodsByDay = new Map();
  recentMoods.forEach((mood) => {
    const dailyScores = moodsByDay.get(mood.date) || [];
    dailyScores.push(mood.score);
    moodsByDay.set(mood.date, dailyScores);
  });

  const dayAverages = [...moodsByDay.entries()].map(([date, scores]) => ({
    completedHabits: completedDayKeys.has(date),
    average: scores.reduce((total, score) => total + score, 0) / scores.length,
  }));
  const averagesWithHabits = dayAverages
    .filter((day) => day.completedHabits)
    .map((day) => day.average);
  const averagesWithoutHabits = dayAverages
    .filter((day) => !day.completedHabits)
    .map((day) => day.average);

  if (averagesWithHabits.length === 0 || averagesWithoutHabits.length === 0) {
    habitMoodInsight.textContent =
      "Registre seu humor e conclua hábitos em mais dias para comparar os padrões.";
    return;
  }

  const mean = (values) =>
    values.reduce((total, value) => total + value, 0) / values.length;
  const withHabits = mean(averagesWithHabits);
  const withoutHabits = mean(averagesWithoutHabits);
  const difference = withHabits - withoutHabits;
  const formatScore = (score) =>
    score.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  if (Math.abs(difference) < 0.1) {
    habitMoodInsight.textContent =
      `Sua média de humor foi semelhante: ${formatScore(withHabits)} com hábitos concluídos e ${formatScore(withoutHabits)} sem.`;
  } else if (difference > 0) {
    habitMoodInsight.textContent =
      `A média foi maior nos dias com hábitos concluídos: ${formatScore(withHabits)} vs. ${formatScore(withoutHabits)}.`;
  } else {
    habitMoodInsight.textContent =
      `A média foi maior nos dias sem hábitos concluídos: ${formatScore(withoutHabits)} vs. ${formatScore(withHabits)}.`;
  }
}

function loadState() {
  const storedState = localStorage.getItem(STORAGE_KEY);
  if (storedState === null) {
    return { habits: [], moods: [] };
  }

  let state;
  try {
    state = JSON.parse(storedState);
  } catch (error) {
    console.error("Não foi possível interpretar os dados salvos do HabitPulse.", error);
    return { habits: [], moods: [] };
  }

  if (!state || !Array.isArray(state.habits) || !Array.isArray(state.moods)) {
    console.error("Os dados salvos do HabitPulse têm um formato inválido.");
    return { habits: [], moods: [] };
  }

  const habits = state.habits.map(normalizeHabitRecord).filter(Boolean);
  const moods = state.moods.map(normalizeMoodRecord).filter(Boolean);

  if (habits.length !== state.habits.length || moods.length !== state.moods.length) {
    console.error("Alguns dados inválidos do HabitPulse foram ignorados.");
  }

  return { habits, moods };
}

let { habits, moods } = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, moods }));
}

function validateBackup(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !Array.isArray(data.habits) ||
    !Array.isArray(data.moods)
  ) {
    throw new Error("O arquivo não contém uma lista válida de hábitos e check-ins.");
  }

  const importedHabits = data.habits.map((habit, index) => {
    if (
      !habit ||
      typeof habit.name !== "string" ||
      !habit.name.trim() ||
      typeof habit.completed !== "boolean" ||
      (habit.completedDates !== undefined &&
        (!Array.isArray(habit.completedDates) ||
          !habit.completedDates.every(
            (date) => typeof date === "string" && isValidDateKey(date),
          )))
    ) {
      throw new Error(`O hábito ${index + 1} tem dados inválidos.`);
    }

    return normalizeHabitRecord(habit);
  });

  const importedMoods = data.moods.map((mood, index) => {
    if (
      !mood ||
      !Number.isInteger(mood.score) ||
      mood.score < 1 ||
      mood.score > 5 ||
      typeof mood.note !== "string" ||
      typeof mood.date !== "string" ||
      (mood.tags !== undefined &&
        (!Array.isArray(mood.tags) ||
          !mood.tags.every((tag) => MOOD_TAGS.includes(tag)))) ||
      (mood.time !== undefined && !/^\d{2}:\d{2}:\d{2}$/.test(mood.time))
    ) {
      throw new Error(`O check-in ${index + 1} tem dados inválidos.`);
    }

    const normalizedMood = normalizeMoodRecord(mood);
    if (!normalizedMood) {
      throw new Error(`A data do check-in ${index + 1} é inválida.`);
    }
    return normalizedMood;
  });

  return { habits: importedHabits, moods: importedMoods };
}

function showBackupFeedback(message, isError = false) {
  backupFeedback.textContent = message;
  backupFeedback.classList.toggle("text-rose-300", isError);
  backupFeedback.classList.toggle("text-mint", !isError);
  backupFeedback.classList.remove("hidden");
}

function exportBackup() {
  const backup = JSON.stringify({ habits, moods }, null, 2);
  const blob = new Blob([backup], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `habitpulse-backup-${formatDateKey(new Date())}.json`;
  document.body.append(link);
  link.click();
  showBackupFeedback("Backup exportado com sucesso.");
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importBackup(file) {
  if (!file.name.toLowerCase().endsWith(".json")) {
    throw new Error("Selecione um arquivo com extensão .json.");
  }

  const backupText = await file.text();
  let parsedBackup;
  try {
    parsedBackup = JSON.parse(backupText);
  } catch (error) {
    throw new Error(INVALID_BACKUP_MESSAGE, { cause: error });
  }

  let importedState;
  try {
    importedState = validateBackup(parsedBackup);
  } catch (error) {
    throw new Error(INVALID_BACKUP_MESSAGE, { cause: error });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(importedState));
  habits = importedState.habits;
  moods = importedState.moods;
  moodForm.reset();
  habitForm.reset();
  renderHabits();
  renderMoodHistory();
  updateMoodChart();
  renderWeeklyInsights();
  showBackupFeedback("Backup importado com sucesso.");
}

exportBackupButton.addEventListener("click", exportBackup);
importBackupButton.addEventListener("click", () => backupFileInput.click());
backupFileInput.addEventListener("change", async () => {
  const [file] = backupFileInput.files;
  if (!file) return;

  try {
    await importBackup(file);
  } catch (error) {
    console.error("Não foi possível importar o backup do HabitPulse.", error);
    showBackupFeedback(`Falha ao importar backup: ${error.message}`, true);
  } finally {
    backupFileInput.value = "";
  }
});

function showMoodFeedback(message, isError = false) {
  moodFeedback.textContent = message;
  moodFeedback.classList.toggle("text-rose-300", isError);
  moodFeedback.classList.toggle("text-mint", !isError);
  moodFeedback.classList.remove("hidden");
  window.setTimeout(() => moodFeedback.classList.add("hidden"), 3500);
}

const initialMoodChartData = getMoodChartData(moods);

const moodChart = new Chart(document.querySelector("#mood-chart"), {
  type: "line",
  data: {
    labels: initialMoodChartData.labels,
    datasets: [
      {
        label: "Humor",
        data: initialMoodChartData.values,
        spanGaps: true,
        borderColor: "#8b7cff",
        backgroundColor: "rgba(139,124,255,.12)",
        pointBackgroundColor: "#55e6bd",
        pointBorderColor: "#121a2d",
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },
    ],
  },
  options: {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#121a2d",
        titleColor: "#fff",
        bodyColor: "#cbd5e1",
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: { stepSize: 1, color: "#64748b", padding: 10 },
        grid: { color: "rgba(255,255,255,.06)" },
        border: { display: false },
      },
      x: {
        ticks: { color: "#64748b", padding: 8 },
        grid: { display: false },
        border: { display: false },
      },
    },
  },
});

moodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const score = Number(new FormData(moodForm).get("mood"));
  const note = document.querySelector("#mood-note").value.trim();
  const tags = new FormData(moodForm).getAll("mood-tags");
  const now = new Date();
  const date = formatDateKey(now);
  const dailyRecordCount = moods.filter((mood) => mood.date === date).length;

  if (dailyRecordCount >= 3) {
    showMoodFeedback("Você já registrou o humor 3 vezes hoje.", true);
    return;
  }

  moods.push({ score, note, tags, date, time: formatTime(now) });
  updateMoodChart(now);
  renderMoodHistory();
  renderWeeklyInsights();
  saveState();
  showMoodFeedback(
    note
      ? "Check-in salvo. Obrigado por compartilhar."
      : "Check-in salvo. Obrigado por fazer essa pausa.",
  );
  moodForm.reset();
});

function updateMoodChart(referenceDate = new Date()) {
  const chartData = getMoodChartData(moods, referenceDate);
  moodChart.data.labels = chartData.labels;
  moodChart.data.datasets[0].data = chartData.values;
  moodChart.update();
}

function formatMoodDateTime(mood) {
  const [year, month, day] = mood.date.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const formattedDate = new Intl.DateTimeFormat("pt-BR").format(date);
  return `${formattedDate} às ${mood.time.slice(0, 5)}`;
}

function createMoodEditForm(mood) {
  const form = document.createElement("form");
  form.className = "space-y-4 rounded-xl border border-violet/20 bg-ink/40 p-4";

  const fieldset = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.className = "mb-2 text-xs font-medium text-slate-300";
  legend.textContent = "Como você estava se sentindo?";
  const scoreOptions = document.createElement("div");
  scoreOptions.className = "flex flex-wrap gap-2";

  moodEmojis.forEach((emoji, index) => {
    const score = index + 1;
    const label = document.createElement("label");
    label.className = "cursor-pointer";
    const input = document.createElement("input");
    input.className = "peer sr-only";
    input.type = "radio";
    input.name = "edited-mood";
    input.value = String(score);
    input.checked = mood.score === score;
    input.required = score === 1;
    const option = document.createElement("span");
    option.className =
      "flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm transition peer-checked:border-violet peer-checked:bg-violet/15";
    option.append(emoji, document.createTextNode(` ${score}`));
    label.append(input, option);
    scoreOptions.append(label);
  });

  fieldset.append(legend, scoreOptions);

  const tagsFieldset = document.createElement("fieldset");
  const tagsLegend = document.createElement("legend");
  tagsLegend.className = "mb-2 text-xs font-medium text-slate-300";
  tagsLegend.textContent = "Tags de sentimento";
  const tagOptions = document.createElement("div");
  tagOptions.className = "flex flex-wrap gap-2";

  MOOD_TAGS.forEach((tag) => {
    const label = document.createElement("label");
    label.className = "cursor-pointer";
    const input = document.createElement("input");
    input.className = "peer sr-only";
    input.type = "checkbox";
    input.name = "edited-tags";
    input.value = tag;
    input.checked = mood.tags.includes(tag);
    const badge = document.createElement("span");
    badge.className =
      "inline-flex rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet/50 peer-checked:border-violet peer-checked:bg-violet/15 peer-checked:text-violet";
    badge.textContent = tag;
    label.append(input, badge);
    tagOptions.append(label);
  });

  tagsFieldset.append(tagsLegend, tagOptions);

  const noteLabel = document.createElement("label");
  noteLabel.className = "block text-xs font-medium text-slate-300";
  noteLabel.textContent = "Anotação (opcional)";
  const noteInput = document.createElement("textarea");
  noteInput.className =
    "mt-2 w-full resize-none rounded-xl border border-white/10 bg-ink/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet/60 focus:ring-2 focus:ring-violet/10";
  noteInput.rows = 2;
  noteInput.maxLength = 280;
  noteInput.value = mood.note;
  noteLabel.append(noteInput);

  const actions = document.createElement("div");
  actions.className = "flex justify-end gap-2";
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className =
    "rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200";
  cancelButton.textContent = "Cancelar";
  cancelButton.addEventListener("click", renderMoodHistory);

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className =
    "rounded-lg bg-violet px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500";
  saveButton.textContent = "Salvar alterações";
  actions.append(cancelButton, saveButton);
  form.append(fieldset, tagsFieldset, noteLabel, actions);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const score = Number(new FormData(form).get("edited-mood"));
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      showMoodFeedback("Selecione uma nota entre 1 e 5.", true);
      return;
    }

    mood.score = score;
    mood.note = noteInput.value.trim();
    mood.tags = new FormData(form).getAll("edited-tags");
    updateMoodChart();
    renderMoodHistory();
    renderWeeklyInsights();
    saveState();
    showMoodFeedback("Check-in atualizado.");
  });

  return form;
}

function createMoodHistoryItem(mood) {
  const item = document.createElement("li");
  item.className =
    "rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4";

  const content = document.createElement("div");
  content.className = "flex items-start gap-3";
  const emoji = document.createElement("span");
  emoji.className =
    "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet/10 text-xl";
  emoji.textContent = moodEmojis[mood.score - 1];

  const details = document.createElement("div");
  details.className = "min-w-0 flex-1";
  const heading = document.createElement("p");
  heading.className = "text-sm font-semibold text-slate-200";
  heading.textContent = `Humor ${mood.score}/5`;
  const timestamp = document.createElement("p");
  timestamp.className = "mt-1 text-xs text-slate-500";
  timestamp.textContent = formatMoodDateTime(mood);
  details.append(heading, timestamp);

  if (mood.note) {
    const note = document.createElement("p");
    note.className = "mt-2 break-words text-sm text-slate-300";
    note.textContent = mood.note;
    details.append(note);
  }
  if (mood.tags.length > 0) {
    const tags = document.createElement("div");
    tags.className = "mt-2 flex flex-wrap gap-1.5";
    mood.tags.forEach((tag) => {
      const badge = document.createElement("span");
      badge.className =
        "rounded-full border border-violet/20 bg-violet/10 px-2.5 py-1 text-[11px] text-violet";
      badge.textContent = tag;
      tags.append(badge);
    });
    details.append(tags);
  }
  content.append(emoji, details);

  const actions = document.createElement("div");
  actions.className = "mt-3 flex justify-end gap-2";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className =
    "rounded-lg px-3 py-2 text-xs font-medium text-violet transition hover:bg-violet/10 focus:outline-none focus:ring-2 focus:ring-violet";
  editButton.textContent = "Editar";
  editButton.setAttribute(
    "aria-label",
    `Editar check-in ${mood.score}/5: ${formatMoodDateTime(mood)}`,
  );
  editButton.addEventListener("click", () => {
    item.replaceChildren(createMoodEditForm(mood));
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className =
    "rounded-lg px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-400";
  deleteButton.textContent = "Excluir";
  deleteButton.setAttribute(
    "aria-label",
    `Excluir check-in ${mood.score}/5: ${formatMoodDateTime(mood)}`,
  );
  deleteButton.addEventListener("click", () => {
    moods = moods.filter((record) => record !== mood);
    updateMoodChart();
    renderMoodHistory();
    renderWeeklyInsights();
    saveState();
  });

  actions.append(editButton, deleteButton);
  item.append(content, actions);
  return item;
}

function renderMoodHistory() {
  const selectedTag = moodTagFilter.value;
  const selectedScore = moodScoreFilter.value;
  const records = moods
    .map((mood, index) => ({ mood, index }))
    .filter(
      ({ mood }) =>
        (!selectedTag || mood.tags.includes(selectedTag)) &&
        (!selectedScore || mood.score === Number(selectedScore)),
    )
    .sort(
      (a, b) =>
        b.mood.date.localeCompare(a.mood.date) ||
        b.mood.time.localeCompare(a.mood.time) ||
        b.index - a.index,
    )
    .map(({ mood }) => createMoodHistoryItem(mood));

  moodHistory.replaceChildren(...records);
  emptyMoods.classList.toggle("hidden", moods.length > 0);
  emptyMoodFilter.classList.toggle(
    "hidden",
    moods.length === 0 || records.length > 0,
  );
}

function updateHabitCount() {
  habitCount.textContent = `${habits.filter((habit) => habit.completed).length}/${habits.length}`;
  emptyHabits.classList.toggle("hidden", habits.length > 0);
}

function createHabitElement(habit) {
  const item = document.createElement("li");
  item.className =
    "group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 transition hover:border-white/15";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = habit.completed;
  checkbox.className = "h-5 w-5 shrink-0 cursor-pointer accent-emerald-400";
  checkbox.setAttribute("aria-label", `Concluir hábito: ${habit.name}`);
  const label = document.createElement("span");
  label.className = "min-w-0 flex-1 break-words text-sm text-slate-200";
  label.textContent = habit.name;
  label.classList.toggle("text-slate-500", habit.completed);
  label.classList.toggle("line-through", habit.completed);
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className =
    "rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400";
  removeButton.textContent = "Excluir";
  removeButton.setAttribute("aria-label", `Excluir hábito: ${habit.name}`);

  checkbox.addEventListener("change", () => {
    habit.completed = checkbox.checked;
    const today = formatDateKey(new Date());
    if (habit.completed) {
      if (!habit.completedDates.includes(today)) {
        habit.completedDates.push(today);
      }
    } else {
      habit.completedDates = habit.completedDates.filter((date) => date !== today);
    }
    label.classList.toggle("text-slate-500", habit.completed);
    label.classList.toggle("line-through", habit.completed);
    updateHabitCount();
    renderWeeklyInsights();
    saveState();
  });
  removeButton.addEventListener("click", () => {
    habits = habits.filter((item) => item !== habit);
    item.remove();
    updateHabitCount();
    renderWeeklyInsights();
    saveState();
  });

  item.append(checkbox, label, removeButton);
  return item;
}

function renderHabits() {
  habitList.replaceChildren(...habits.map(createHabitElement));
  updateHabitCount();
}

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = habitInput.value.trim();
  if (!name) return;

  const habit = { name, completed: false, completedDates: [] };
  habits.push(habit);
  habitList.append(createHabitElement(habit));
  habitForm.reset();
  habitInput.focus();
  updateHabitCount();
  saveState();
});

renderHabits();
moodTagFilter.addEventListener("change", renderMoodHistory);
moodScoreFilter.addEventListener("change", renderMoodHistory);
renderMoodHistory();
renderWeeklyInsights();
