(() => {
  const translations = new Map(Object.entries({
    "Menu": "Меню", "Home": "Головна", "Login": "Увійти", "Log in": "Увійти", "Log out": "Вийти",
    "Schedule": "Програма", "Photos": "Фото", "RSVP": "Підтвердити участь", "Registry": "Подарунки",
    "Anatoliy": "Анатолій", "Elizabeth": "Єлизавета", "We said yes": "Ми сказали «так»",
    "Share the joy": "Розділіть нашу радість", "Wedding schedule": "Програма весілля",
    "Ceremony": "Церемонія", "Celebration": "Святкування", "Time to be announced": "Час повідомимо згодом",
    "Location to be announced": "Місце повідомимо згодом", "From your point of view": "Вашими очима",
    "Help us remember": "Допоможіть нам зберегти", "every little moment.": "кожну мить.",
    "The happy tears, the dance moves, the moments we missed— share your photos and videos from our day.": "Сльози щастя, танці та миті, яких ми не помітили — поділіться фото й відео з нашого свята.",
    "Checking when photo sharing opens…": "Перевіряємо, коли можна буде ділитися фото…",
    "Choose from library": "Вибрати з галереї", "Photos and videos": "Фото та відео", "Open camera": "Відкрити камеру",
    "Take a photo or video": "Зробити фото або відео", "Camera photos and videos upload automatically after capture.": "Фото та відео з камери завантажуються автоматично після зйомки.",
    "Dismiss message": "Закрити повідомлення", "High-quality camera": "Камера високої якості", "Close camera": "Закрити камеру",
    "Change camera quality": "Змінити якість зйомки", "Change exposure": "Змінити експозицію", "Uploading photo": "Завантажуємо фото",
    "Starting high-quality camera…": "Запускаємо камеру високої якості…", "Video": "Відео", "Photo": "Фото",
    "Take photo": "Зробити фото", "Switch camera": "Перемкнути камеру", "Clear": "Очистити", "Upload memories": "Завантажити спогади",
    "Anyone can upload without an account. If you are signed in through RSVP, your memories will be labeled with your reservation name. Uploads can only be viewed by Anatoliy and Elizabeth.": "Кожен може завантажувати без облікового запису. Якщо ви увійшли через сторінку підтвердження участі, ваші спогади будуть підписані прізвищем із вашої заявки. Завантажені матеріали можуть переглядати лише Анатолій та Єлизавета.",
    "With love & gratitude": "З любов’ю та вдячністю", "Our wedding registry": "Наш список весільних подарунків",
    "Your presence means so much to us. If you’d like to give a gift, you can find our registry on Amazon.": "Ваша присутність дуже важлива для нас. Якщо ви бажаєте зробити подарунок, наш список побажань є на Amazon.",
    "View our Amazon registry": "Переглянути список на Amazon", "Page navigation": "Навігація сторінкою", "Account sections": "Розділи облікового запису",
    "My photos": "Мої фото", "Your response": "Ваша відповідь", "Will you join us?": "Чи будете ви з нами?",
    "Family or household name": "Прізвище родини", "The Smith family": "Родина Шевченків", "Are you attending?": "Чи плануєте ви прийти?",
    "Joyfully accepts": "З радістю прийдемо", "Regretfully declines": "На жаль, не зможемо", "Adults": "Дорослі", "Children": "Діти",
    "Message or dietary notes": "Повідомлення або побажання щодо харчування", "Save reservation": "Зберегти відповідь", "Your memories": "Ваші спогади",
    "Only photos uploaded while signed in to this account appear here.": "Тут відображаються лише фото, завантажені після входу в цей обліковий запис.",
    "Loading your photos…": "Завантажуємо ваші фото…", "Welcome back": "Раді бачити вас знову",
    "Access your household reservation and update your response anytime.": "Переглядайте та змінюйте відповідь вашої родини в будь-який час.",
    "Email": "Електронна пошта", "Password": "Пароль", "Need an account?": "Ще немає облікового запису?", "Create one": "Створити",
    "Create your account": "Створіть обліковий запис", "Create one account for your household, then complete your RSVP.": "Створіть один обліковий запис для вашої родини, а потім підтвердьте участь.",
    "Create account": "Створити обліковий запис", "Already have an account?": "Вже маєте обліковий запис?",
    "Only registered guests can see their own uploaded photos here. Log in or create an account to continue.": "Тут зареєстровані гості можуть переглядати власні завантажені фото. Увійдіть або створіть обліковий запис.",
    "Logging in…": "Входимо…", "Signing in…": "Входимо…", "Creating account…": "Створюємо обліковий запис…",
    "Account created. Check your email to confirm it, then log in.": "Обліковий запис створено. Підтвердьте електронну адресу через лист, а потім увійдіть.",
    "Invalid login credentials.": "Неправильна електронна адреса або пароль.", "Invalid login credentials": "Неправильна електронна адреса або пароль.",
    "Email not confirmed": "Електронну адресу не підтверджено", "User already registered": "Користувач уже зареєстрований",
    "Password should be at least 8 characters.": "Пароль має містити щонайменше 8 символів.",
    "Your session expired. Please log in again.": "Термін дії сеансу минув. Увійдіть знову.", "Your session expired. Please sign in again.": "Термін дії сеансу минув. Увійдіть знову.",
    "Log in to view or update your RSVP.": "Увійдіть, щоб переглянути або змінити вашу відповідь.", "Loading your memories…": "Завантажуємо ваші спогади…",
    "You have not uploaded any signed-in photos or videos yet.": "Ви ще не завантажували фото чи відео після входу в обліковий запис.",
    "Download": "Завантажити", "↓ Download": "↓ Завантажити", "Preparing…": "Готуємо…", "Try again": "Спробувати ще раз",
    "Enter at least one guest.": "Вкажіть щонайменше одного гостя.", "Saving…": "Зберігаємо…", "Your reservation has been saved. Thank you!": "Вашу відповідь збережено. Дякуємо!",
    "Optimizing photos for a faster upload…": "Оптимізуємо фото для швидшого завантаження…", "The upload failed. Please try again.": "Не вдалося завантажити. Спробуйте ще раз.",
    "High-quality camera could not open. Opening your phone camera instead.": "Не вдалося запустити камеру високої якості. Відкриваємо камеру вашого телефону.",
    "Photo captured · Uploading automatically…": "Фото зроблено · Завантажуємо автоматично…", "Photo uploaded · Ready for another": "Фото завантажено · Можна знімати далі",
    "Upload failed · Photo kept for retry": "Завантаження не вдалося · Фото збережено для повторної спроби",
    "The recording exceeded 50 MB. Please record a shorter video.": "Розмір запису перевищує 50 МБ. Запишіть коротше відео.",
    "Photo taken · Uploading": "Фото зроблено · Завантажуємо", "Video taken · Uploading": "Відео знято · Завантажуємо",
    "Photo uploaded": "Фото завантажено", "Video uploaded": "Відео завантажено", "Photo taken · Upload failed": "Фото зроблено · Завантаження не вдалося",
    "Video taken · Upload failed": "Відео знято · Завантаження не вдалося", "For our eyes only": "Лише для нас", "Private gallery": "Приватна галерея",
    "Sign in to view and download the memories shared by our guests.": "Увійдіть, щоб переглядати й завантажувати спогади наших гостей.", "Open gallery": "Відкрити галерею",
    "Reservations": "Відповіді гостей", "Settings": "Налаштування", "Guest memories": "Спогади гостей", "Our gallery": "Наша галерея",
    "Select visible": "Вибрати видимі", "Delete selected": "Видалити вибрані", "Loading photos…": "Завантажуємо фото…", "Load more photos": "Показати ще фото",
    "Wedding details": "Деталі весілля", "Site settings": "Налаштування сайту",
    "Choose when photo sharing opens and update the time and location shown in the wedding schedule.": "Оберіть, коли відкриється завантаження фото, та оновіть час і місце у програмі весілля.",
    "Guest photos": "Фото гостей", "Unlock date and time": "Дата й час відкриття", "Time": "Час", "Location": "Місце",
    "Venue or address": "Місце або адреса", "Reception venue or address": "Місце святкування або адреса", "Save settings": "Зберегти налаштування",
    "Guest responses": "Відповіді гостей", "Loading reservations…": "Завантажуємо відповіді…", "Family": "Родина", "Response": "Відповідь",
    "Total": "Разом", "Notes": "Примітки", "Submitted": "Надіслано", "Photo viewer": "Перегляд фото", "Close photo viewer": "Закрити перегляд фото",
    "View previous photo": "Попереднє фото", "View next photo": "Наступне фото", "Guest wedding memory enlarged": "Збільшене весільне фото гостя",
    "Select": "Вибрати", "Attending": "Прийдуть", "Declined": "Не прийдуть", "Families coming": "Родин прийдуть", "Total guests": "Усього гостей",
    "Loading settings…": "Завантажуємо налаштування…", "Site settings saved.": "Налаштування збережено.", "No reservations have been submitted yet.": "Відповідей поки немає.",
    "No photos or videos have been uploaded yet.": "Фото та відео поки не завантажені.", "Anonymous guest": "Анонімний гість", "Guest": "Гість",
    "Unable to create account.": "Не вдалося створити обліковий запис.", "Sign-in failed.": "Не вдалося увійти.", "Unable to save reservation.": "Не вдалося зберегти відповідь.",
    "Unable to load your memories.": "Не вдалося завантажити ваші спогади.", "Unable to load reservations.": "Не вдалося завантажити відповіді.",
    "Unable to save the settings.": "Не вдалося зберегти налаштування.", "Unable to match photos to reservations.": "Не вдалося зіставити фото з відповідями гостей.",
    "Site settings have not been installed yet.": "Налаштування сайту ще не встановлено.", "Saved session is incomplete.": "Збережений сеанс неповний.", "Session expired.": "Термін дії сеансу минув.",
    "Unable to restore your account session.": "Не вдалося відновити сеанс.", "Unable to load your reservation name.": "Не вдалося завантажити прізвище з вашої заявки.",
    "Photo uploads are not configured.": "Завантаження фото ще не налаштовано.", "Gallery access is not configured.": "Доступ до галереї ще не налаштовано.",
    "Account creation is not configured.": "Створення облікових записів ще не налаштовано.", "Login is not configured.": "Вхід ще не налаштовано.", "RSVP is not configured.": "Підтвердження участі ще не налаштовано.",
    "Failed to fetch": "Не вдалося з’єднатися. Перевірте інтернет і спробуйте ще раз.",
    "High-quality camera ready": "Камера високої якості готова", "Your wedding photo": "Ваше весільне фото", "Guest wedding memory": "Весільне фото гостя",
    "Media unavailable": "Медіафайл недоступний", "Media could not be loaded": "Не вдалося завантажити медіафайл", "View photo full size": "Переглянути фото в повному розмірі",
    "Share your favorite moments from our wedding day.": "Поділіться улюбленими митями нашого весілля.", "RSVP for the wedding of Anatoliy and Elizabeth.": "Підтвердьте участь у весіллі Анатолія та Єлизавети.",
    "Log in to view or update your wedding reservation.": "Увійдіть, щоб переглянути або змінити вашу відповідь щодо участі у весіллі.",
    "Create an account for your household wedding reservation.": "Створіть обліковий запис для підтвердження участі вашої родини у весіллі."
  }));
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const ukrainianMonths = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  const patterns = [
    [/^(\d+) memor(?:y|ies)$/, (_, n) => `Спогадів: ${n}`],
    [/^(\d+) memor(?:y|ies) ready$/, (_, n) => `Готово до завантаження: ${n}`],
    [/^(\d+) memor(?:y was|ies were) uploaded\. Thank you!$/, (_, n) => `Завантажено спогадів: ${n}. Дякуємо!`],
    [/^Uploading (\d+) of (\d+)(?: as (.*?))? · (\d+)%$/, (_, n, total, name, percent) => `Завантажуємо ${n} із ${total}${name ? ` від ${name}` : ""} · ${percent}%`],
    [/^(\d+) files? (?:was|were) skipped\. Images can be 15 MB and videos 50 MB\.$/, (_, n) => `Пропущено файлів: ${n}. Максимум для фото — 15 МБ, для відео — 50 МБ.`],
    [/^Connection interrupted\. Retrying (\(.*\))…$/, (_, attempt) => `З’єднання перервано. Повторна спроба ${attempt}…`],
    [/^Recording · (.*)$/, (_, time) => `Запис · ${time}`],
    [/^Delete selected \((\d+)\)$/, (_, n) => `Видалити вибрані (${n})`],
    [/^Deleting (\d+) memor(?:y|ies)…$/, (_, n) => `Видаляємо спогадів: ${n}…`],
    [/^(\d+) memor(?:y was|ies were) permanently deleted\.$/, (_, n) => `Назавжди видалено спогадів: ${n}.`],
    [/^Permanently delete (\d+) selected memor(?:y|ies)\? This cannot be undone\.$/, (_, n) => `Назавжди видалити вибрані спогади (${n})? Цю дію неможливо скасувати.`],
    [/^Loading full photo… · (\d+) of (\d+)$/, (_, n, total) => `Завантажуємо повне фото… · ${n} із ${total}`],
    [/^(.*) · (\d+) of (\d+)$/, (_, name, n, total) => `${name} · ${n} із ${total}`],
    [/^Unable to (list photos|delete selected memories|load a photo|load the full photo) \((.*)\)\.$/, (_, action, code) => `Не вдалося ${({ "list photos": "отримати список фото", "delete selected memories": "видалити вибрані спогади", "load a photo": "завантажити фото", "load the full photo": "завантажити повне фото" })[action]} (${code}).`],
    [/^Upload failed \((.*)\)\.$/, (_, code) => `Завантаження не вдалося (${code === "network error" ? "помилка мережі" : code}).`]
  ];
  const originals = new WeakMap();
  const reverse = new Map();
  let language = "en";
  try { if (localStorage.getItem("weddingLanguage") === "uk") language = "uk"; } catch {}

  function ukrainian(text) {
    if (translations.has(text)) return translations.get(text);
    for (const [pattern, replace] of patterns) if (pattern.test(text)) return text.replace(pattern, replace);
    if (/^(?:RSVP|Login|Create account|Gallery|Anatoliy).*\|/.test(text)) {
      return text.replace("Create account", "Створити обліковий запис").replace("Login", "Вхід").replace("Gallery", "Галерея").replace("RSVP", "Підтвердження участі").replace("Anatoliy", "Анатолій").replace("Elizabeth", "Єлизавета");
    }
    if (/^(?:Camera locked\. )?Photo sharing opens /.test(text)) return text.replace("Camera locked. ", "Камера заблокована. ").replace("Photo sharing opens ", "Завантаження фото відкриється ").replace(/([A-Z][a-z]+) (\d+), (\d{4}) at (\d+):(\d+) (AM|PM)/, (_, month, day, year, hour, minute, period) => `${day} ${ukrainianMonths[months.indexOf(month)]} ${year} о ${String(Number(hour) % 12 + (period === "PM" ? 12 : 0)).padStart(2, "0")}:${minute}`);
    const date = /^([A-Z][a-z]+) (\d+), (\d{4})$/.exec(text);
    if (date) {
      const month = months.findIndex(value => value === date[1] || value.slice(0, 3) === date[1]);
      if (month !== -1) return `${date[2]} ${ukrainianMonths[month]} ${date[3]}`;
    }
    const time = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(text);
    if (time) return `${String(Number(time[1]) % 12 + (time[3] === "PM" ? 12 : 0)).padStart(2, "0")}:${time[2]}`;
    if (text.startsWith("Select ")) return text.replace("Select ", "Вибрати ");
    return text.replace("High-quality camera ready", "Камера високої якості готова").replace("Recording at ", "Роздільна здатність: ").replace(" FPS", " кадрів/с").replace(" · Digital pinch to zoom", " · Змінюйте масштаб двома пальцями").replace(" · Pinch to zoom", " · Змінюйте масштаб двома пальцями");
  }

  function translate(text) {
    if (language !== "uk") return text;
    const trimmed = text.trim().replace(/\s+/g, " ");
    const result = ukrainian(trimmed);
    return result === trimmed ? text : text.replace(text.trim(), result);
  }

  function update(node, key, read, write) {
    const current = read();
    if (!current) return;
    let saved = originals.get(node);
    if (!saved) { saved = {}; originals.set(node, saved); }
    if (!saved[key] || current !== saved[key].rendered) saved[key] = { source: reverse.get(current) || current };
    const value = translate(saved[key].source);
    saved[key].rendered = value;
    if (value !== saved[key].source) reverse.set(value, saved[key].source);
    if (current !== value) write(value);
  }

  function render(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (!root.parentElement?.closest('script, style, textarea, [translate="no"], .language-toggle, .photo-uploader, #selectionNames, #ceremonyLocation, #celebrationLocation')) update(root, "text", () => root.nodeValue, value => { root.nodeValue = value; });
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.matches('script, style, textarea, [translate="no"], .language-toggle')) return;
    for (const attr of ["aria-label", "placeholder", "title", "alt"]) if (root.hasAttribute(attr)) update(root, attr, () => root.getAttribute(attr), value => root.setAttribute(attr, value));
    if (root.matches('meta[name="description"]')) update(root, "content", () => root.content, value => { root.content = value; });
    root.childNodes.forEach(render);
  }

  const button = document.createElement("button");
  button.className = "language-toggle";
  button.type = "button";
  const menuButton = document.querySelector(".nav-toggle");
  menuButton.before(button);
  function refresh() {
    document.documentElement.lang = language;
    button.textContent = language === "uk" ? "English" : "По Українськи";
    button.lang = language === "uk" ? "en" : "uk";
    button.setAttribute("aria-label", language === "uk" ? "Switch to English" : "Переключити на українську");
    render(document.documentElement);
  }
  button.addEventListener("click", () => {
    language = language === "uk" ? "en" : "uk";
    try { localStorage.setItem("weddingLanguage", language); } catch {}
    refresh();
  });
  window.addEventListener("storage", event => {
    if (event.key === "weddingLanguage") { language = event.newValue === "uk" ? "uk" : "en"; refresh(); }
  });
  window.weddingTranslate = translate;
  refresh();
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "childList") record.addedNodes.forEach(render);
      else render(record.target);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title", "alt", "content"] });
})();
