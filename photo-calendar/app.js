const DB_NAME = "photo-calendar";
const DB_VERSION = 1;
const STORE_NAME = "days";
const zoomKey = "photo-calendar-zoom";

const monthLabel = document.querySelector("#monthLabel");
const calendarGrid = document.querySelector("#calendarGrid");
const calendarStatus = document.querySelector("#calendarStatus");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const todayButton = document.querySelector("#todayButton");
const zoomButtons = document.querySelectorAll("[data-zoom]");
const imageFitButtons = document.querySelectorAll("[data-image-fit]");

const dayDialog = document.querySelector("#dayDialog");
const closeDialog = document.querySelector("#closeDialog");
const dialogDate = document.querySelector("#dialogDate");
const dialogTitle = document.querySelector("#dialogTitle");
const photoInput = document.querySelector("#photoInput");
const photoPickerLabel = document.querySelector("#photoPickerLabel");
const photoPreview = document.querySelector("#photoPreview");
const photoPlaceholder = document.querySelector("#photoPlaceholder");
const photoStrip = document.querySelector("#photoStrip");
const titleInput = document.querySelector("#titleInput");
const noteInput = document.querySelector("#noteInput");
const addPhoto = document.querySelector("#addPhoto");
const removePhoto = document.querySelector("#removePhoto");
const cancelEdit = document.querySelector("#cancelEdit");
const saveDay = document.querySelector("#saveDay");

let dbPromise;
let cursorDate = startOfMonth(new Date());
let selectedDateKey = toDateKey(new Date());
let selectedRecord = null;
let selectedEvents = [];
let selectedEventIndex = 0;
let isClosing = false;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "date" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function withStore(mode, callback) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = callback(store);

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function getAllRecords() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getRecord(date) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(date);

    request.onsuccess = () => resolve(request.result || { date, events: [] });
    request.onerror = () => reject(request.error);
  });
}

async function saveRecord(record) {
  await withStore("readwrite", (store) => store.put(record));
}

async function deleteRecord(date) {
  await withStore("readwrite", (store) => store.delete(date));
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDay(dateKey) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

function normalizeEvents(record) {
  return (record?.events || []).map((event) => ({
    id: event.id || crypto.randomUUID(),
    title: event.title || "",
    note: event.note || "",
    imageData: event.imageData || null,
    imageName: event.imageName || "",
    createdAt: event.createdAt || new Date().toISOString(),
    updatedAt: event.updatedAt || new Date().toISOString(),
  }));
}

function eventFor(record) {
  return normalizeEvents(record).find((event) => event.imageData) || null;
}

function photoEventsFor(record) {
  return normalizeEvents(record).filter((event) => event.imageData);
}

function selectedEvent() {
  return selectedEvents[selectedEventIndex] || null;
}

function hasEventContent(event) {
  return Boolean(event?.title?.trim() || event?.note?.trim() || event?.imageData);
}

function getEventTitle(event, dateKey) {
  if (event?.title?.trim()) return event.title.trim();
  return `Photo for ${formatDay(dateKey)}`;
}

async function renderCalendar() {
  const records = await getAllRecords();
  const recordsByDate = new Map(records.map((record) => [record.date, record]));
  const firstVisible = new Date(cursorDate);
  firstVisible.setDate(1 - firstVisible.getDay());

  monthLabel.textContent = formatMonth(cursorDate);
  calendarGrid.textContent = "";

  const fragment = document.createDocumentFragment();
  const todayKey = toDateKey(new Date());
  let photoCount = 0;

  for (let index = 0; index < 42; index += 1) {
    const day = new Date(firstVisible);
    day.setDate(firstVisible.getDate() + index);

    const dateKey = toDateKey(day);
    const record = recordsByDate.get(dateKey);
    const primaryEvent = eventFor(record);
    const photoEvents = photoEventsFor(record);
    const hasPhoto = Boolean(primaryEvent);
    const isOutside = day.getMonth() !== cursorDate.getMonth();
    if (hasPhoto) photoCount += photoEvents.length;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = [
      "day-cell",
      isOutside ? "is-outside" : "",
      dateKey === todayKey ? "is-today" : "",
      hasPhoto ? "has-photo" : "",
    ]
      .filter(Boolean)
      .join(" ");
    cell.dataset.date = dateKey;
    cell.setAttribute(
      "aria-label",
      hasPhoto
        ? `${formatDay(dateKey)}. ${photoEvents.length} photo${photoEvents.length === 1 ? "" : "s"}. Open day.`
        : `${formatDay(dateKey)}. Add photo.`
    );

    const visual = document.createElement("span");
    visual.className = [
      "day-visual",
      photoEvents.length > 1 ? "has-many" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (hasPhoto) {
      photoEvents.slice(0, 4).forEach((event) => {
        const img = document.createElement("img");
        img.src = event.imageData;
        img.alt = "";
        visual.append(img);
      });
    } else {
      const mark = document.createElement("span");
      mark.className = "empty-mark";
      mark.textContent = "+";
      visual.append(mark);
    }

    const meta = document.createElement("span");
    meta.className = "day-meta";

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = String(day.getDate());
    meta.append(dayNumber);

    const weekdayName = document.createElement("span");
    weekdayName.className = "day-weekday";
    weekdayName.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
    }).format(day);
    meta.append(weekdayName);

    const summary = document.createElement("span");
    summary.className = "photo-summary";

    if (hasPhoto) {
      const title = document.createElement("span");
      title.className = "photo-title";
      title.textContent = primaryEvent.title || primaryEvent.note || "";
      summary.append(title);
    }

    if (photoEvents.length > 1) {
      const count = document.createElement("span");
      count.className = "event-count";
      count.textContent = String(photoEvents.length);
      summary.append(count);
    }

    meta.append(summary);
    cell.append(visual, meta);
    cell.addEventListener("click", () => openEditor(dateKey));
    fragment.append(cell);
  }

  calendarGrid.append(fragment);
  calendarStatus.textContent = `${photoCount} photo${photoCount === 1 ? "" : "s"} this view`;
}

async function openEditor(dateKey) {
  selectedDateKey = dateKey;
  selectedRecord = await getRecord(dateKey);
  selectedEvents = normalizeEvents(selectedRecord);
  selectedEventIndex = selectedEvents.findIndex((event) => event.imageData);
  if (selectedEventIndex < 0) selectedEventIndex = 0;

  dialogDate.textContent = formatDay(dateKey);
  photoInput.value = "";
  loadSelectedEvent();
  renderPhotoStrip();

  if (typeof dayDialog.showModal === "function") {
    dayDialog.showModal();
  } else {
    dayDialog.setAttribute("open", "");
  }

  const focusTarget = selectedEvent()?.imageData ? titleInput : photoInput;
  setTimeout(() => focusTarget.focus(), 0);
}

function createBlankEvent() {
  return {
    id: crypto.randomUUID(),
    title: "",
    note: "",
    imageData: null,
    imageName: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function ensureSelectedEvent() {
  if (!selectedEvent()) {
    selectedEvents.push(createBlankEvent());
    selectedEventIndex = selectedEvents.length - 1;
  }

  return selectedEvent();
}

function commitFieldsToSelected() {
  const event = selectedEvent();
  const title = titleInput.value.trim();
  const note = noteInput.value.trim();

  if (!event && !title && !note) return;

  const nextEvent = event || ensureSelectedEvent();
  nextEvent.title = title;
  nextEvent.note = note;
  nextEvent.updatedAt = new Date().toISOString();
}

function loadSelectedEvent() {
  const event = selectedEvent();

  dialogTitle.textContent = event?.title || "Day photo";
  titleInput.value = event?.title || "";
  noteInput.value = event?.note || "";
  updatePreview();
}

function updatePreview() {
  const event = selectedEvent();

  if (event?.imageData) {
    photoPreview.src = event.imageData;
    photoPreview.alt = event.title
      ? event.title
      : `Selected photo for ${formatDay(selectedDateKey)}`;
    photoPreview.hidden = false;
    photoPlaceholder.hidden = true;
    photoPickerLabel.textContent = "Replace Photo";
    removePhoto.disabled = false;
  } else {
    photoPreview.removeAttribute("src");
    photoPreview.alt = "";
    photoPreview.hidden = true;
    photoPlaceholder.hidden = false;
    photoPickerLabel.textContent = "Choose Photo";
    removePhoto.disabled = true;
  }

  saveDay.disabled = false;
}

function renderPhotoStrip() {
  photoStrip.textContent = "";

  selectedEvents.forEach((event, index) => {
    if (!hasEventContent(event)) return;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "photo-strip-item";
    item.setAttribute("aria-pressed", String(index === selectedEventIndex));
    item.setAttribute(
      "aria-label",
      event.imageData
        ? `Edit photo ${index + 1}`
        : `Edit item ${index + 1}`
    );

    if (event.imageData) {
      const img = document.createElement("img");
      img.src = event.imageData;
      img.alt = "";
      item.append(img);
    } else {
      item.textContent = event.title || "Text";
    }

    item.addEventListener("click", () => {
      commitFieldsToSelected();
      selectedEventIndex = index;
      loadSelectedEvent();
      renderPhotoStrip();
    });

    photoStrip.append(item);
  });

  const addItem = document.createElement("button");
  addItem.type = "button";
  addItem.className = "photo-strip-item add-strip-item";
  addItem.setAttribute("aria-label", "Add another photo");
  addItem.textContent = "+";
  addItem.addEventListener("click", () => {
    commitFieldsToSelected();
    selectedEvents.push(createBlankEvent());
    selectedEventIndex = selectedEvents.length - 1;
    loadSelectedEvent();
    renderPhotoStrip();
    photoInput.click();
  });
  photoStrip.append(addItem);
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function cleanEvents(events) {
  return events.filter(hasEventContent);
}

async function saveSelectedDay({ close = true } = {}) {
  if (isClosing) return;
  isClosing = true;
  saveDay.disabled = true;

  try {
    commitFieldsToSelected();
    selectedEvents = cleanEvents(selectedEvents);

    if (selectedEvents.length === 0) {
      await deleteRecord(selectedDateKey);
    } else {
      await saveRecord({
        date: selectedDateKey,
        events: selectedEvents,
        updatedAt: new Date().toISOString(),
      });
    }

    selectedRecord = { date: selectedDateKey, events: selectedEvents };
    if (close) closeEditor();
    await renderCalendar();
  } finally {
    saveDay.disabled = false;
    isClosing = false;
  }
}

function closeEditor() {
  if (dayDialog.open) dayDialog.close();
}

function closeWithoutSaving() {
  closeEditor();
}

function setZoom(zoom) {
  document.body.dataset.zoom = zoom;
  localStorage.setItem(zoomKey, zoom);

  zoomButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.zoom === zoom));
  });
}

function setImageFit(fit) {
  document.body.dataset.imageFit = fit;

  imageFitButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.imageFit === fit));
  });
}

prevMonth.addEventListener("click", () => {
  cursorDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonth.addEventListener("click", () => {
  cursorDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 1);
  renderCalendar();
});

todayButton.addEventListener("click", () => {
  cursorDate = startOfMonth(new Date());
  renderCalendar();
});

zoomButtons.forEach((button) => {
  button.addEventListener("click", () => setZoom(button.dataset.zoom));
});

imageFitButtons.forEach((button) => {
  button.addEventListener("click", () => setImageFit(button.dataset.imageFit));
});

photoInput.addEventListener("change", async () => {
  const [file] = photoInput.files;
  if (!file) return;

  const event = ensureSelectedEvent();
  event.imageData = await readPhoto(file);
  event.imageName = file.name;
  event.updatedAt = new Date().toISOString();
  photoInput.value = "";
  updatePreview();
  renderPhotoStrip();
});

titleInput.addEventListener("input", () => {
  const event = ensureSelectedEvent();
  event.title = titleInput.value.trim();
  event.updatedAt = new Date().toISOString();
  dialogTitle.textContent = event.title || "Day photo";
  updatePreview();
  renderPhotoStrip();
});

noteInput.addEventListener("input", () => {
  const event = ensureSelectedEvent();
  event.note = noteInput.value.trim();
  event.updatedAt = new Date().toISOString();
  renderPhotoStrip();
});

addPhoto.addEventListener("click", () => {
  commitFieldsToSelected();
  selectedEvents.push(createBlankEvent());
  selectedEventIndex = selectedEvents.length - 1;
  loadSelectedEvent();
  renderPhotoStrip();
  photoInput.click();
});

removePhoto.addEventListener("click", () => {
  if (!selectedEvent()) return;

  selectedEvents.splice(selectedEventIndex, 1);
  selectedEventIndex = Math.max(0, Math.min(selectedEventIndex, selectedEvents.length - 1));
  photoInput.value = "";
  loadSelectedEvent();
  renderPhotoStrip();
});

cancelEdit.addEventListener("click", closeWithoutSaving);
closeDialog.addEventListener("click", () => saveSelectedDay());

dayDialog.addEventListener("click", (event) => {
  if (event.target === dayDialog) saveSelectedDay();
});

dayDialog.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveSelectedDay();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" && !dayDialog.open) {
    cursorDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth() - 1, 1);
    renderCalendar();
  }

  if (event.key === "ArrowRight" && !dayDialog.open) {
    cursorDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 1);
    renderCalendar();
  }
});

setZoom(localStorage.getItem(zoomKey) || "comfortable");
localStorage.removeItem("photo-calendar-image-fit");
setImageFit("contain");
renderCalendar();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}
