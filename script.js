const registrationSubPages = {
  loading: 0,
  invalidCode: 1,
  basicInformationForm: 2,
  profilePicture: 3,
  finished: 4,
};

const registrationNamePattern = /^[a-zA-ZåäöÅÄÖ0-9]{3,36}$/;

let currentRegisteredUser = null;
let currentRegistration = null;
let selectedProfilePictureFile = null;
let selectedProfilePictureUrl = null;
let selectedProfilePictureToken = 0;

const profilePictureSize = 500;

function goToRegistrationSubPage(page) {
  switch (page) {
    case registrationSubPages.loading:
      dom.pfpPage.container.hidden = true;
      dom.basicInfoPage.container.hidden = true;
      dom.finishPage.container.hidden = true;
      dom.invalidCode.container.hidden = true;
      dom.loading.container.hidden = false;
      break;
    case registrationSubPages.invalidCode:
      dom.pfpPage.container.hidden = true;
      dom.basicInfoPage.container.hidden = true;
      dom.finishPage.container.hidden = true;
      dom.invalidCode.container.hidden = false;
      dom.loading.container.hidden = true;
      break;
    case registrationSubPages.basicInformationForm:
      dom.pfpPage.container.hidden = true;
      dom.basicInfoPage.container.hidden = false;
      dom.finishPage.container.hidden = true;
      dom.invalidCode.container.hidden = true;
      dom.loading.container.hidden = true;
      break;
    case registrationSubPages.profilePicture:
      dom.pfpPage.container.hidden = false;
      dom.basicInfoPage.container.hidden = true;
      dom.finishPage.container.hidden = true;
      dom.invalidCode.container.hidden = true;
      dom.loading.container.hidden = true;
      break;
    case registrationSubPages.finished:
      dom.pfpPage.container.hidden = true;
      dom.basicInfoPage.container.hidden = true;
      dom.finishPage.container.hidden = false;
      dom.invalidCode.container.hidden = true;
      dom.loading.container.hidden = true;
      break;
  }
}

function initializeRegistrationBasicInfoSubPage() {
  dom.basicInfoPage.form.reset();
  dom.basicInfoPage.content.open = false;
}

function initializeRegistrationProfilePictureSubPage() {
  const fileInput = dom.pfpPage.fileInput;
  const photo = dom.pfpPage.photo;
  const chooseButton = dom.pfpPage.chooseButton;
  const clearButton = dom.pfpPage.clearButton;
  const useButton = dom.pfpPage.useButton;
  const skipButton = dom.pfpPage.skipButton;

  clearSelectedProfilePicture();
  fileInput.value = "";
  photo.hidden = true;
  chooseButton.hidden = false;
  clearButton.hidden = true;
  skipButton.hidden = false;
  useButton.hidden = true;

  if (!chooseButton.dataset.bound) {
    chooseButton.dataset.bound = "true";
  }

  if (!clearButton.dataset.bound) {
    clearButton.dataset.bound = "true";
    clearButton.addEventListener("click", (event) => {
      event.preventDefault();
      clearSelectedProfilePicture();
    });
  }

  if (!fileInput.dataset.bound) {
    fileInput.dataset.bound = "true";
    fileInput.addEventListener("change", () => {
      setSelectedProfilePicture(fileInput.files?.[0] ?? null);
    });
  }

  if (selectedProfilePictureFile) {
    chooseButton.hidden = true;
    useButton.hidden = false;
    clearButton.hidden = false;
    photo.hidden = false;
    return;
  }
}

async function initializeRegistrationFinishedSubPage() {
  dom.finishPage.name.innerText = `${currentRegisteredUser.username}`;
  dom.finishPage.pfp.src = api.getUserProfilePictureUrl(
    currentRegisteredUser.id,
  );
  dom.finishPage.program.innerText = formatProgram(
    currentRegisteredUser.schoolProgram,
  );

  currentRegistration = null;
}

function cancelCaptureCountdown() {
  clearSelectedProfilePicture();
}

async function setSelectedProfilePicture(file) {
  const photo = dom.pfpPage.photo;
  const chooseButton = dom.pfpPage.chooseButton;
  const useButton = dom.pfpPage.useButton;
  const clearButton = dom.pfpPage.clearButton;

  clearSelectedProfilePicture();
  const selectionToken = selectedProfilePictureToken;

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Välj en bildfil.");
    return;
  }

  try {
    const { file: croppedFile, url } = await cropProfilePicture(file);

    if (selectionToken !== selectedProfilePictureToken) {
      URL.revokeObjectURL(url);
      return;
    }

    selectedProfilePictureFile = croppedFile;
    selectedProfilePictureUrl = url;

    photo.src = selectedProfilePictureUrl;
    photo.hidden = false;
    chooseButton.hidden = true;
    clearButton.hidden = false;
    useButton.hidden = false;
  } catch (error) {
    if (selectionToken === selectedProfilePictureToken) {
      console.error("Kunde inte förbereda profilbilden.", error);
      alert("Kunde inte läsa bilden. Försök igen med en annan fil.");
    }
  }
}

async function useProfilePicture() {
  const useButton = dom.pfpPage.useButton;

  if (!selectedProfilePictureFile) {
    alert("Välj en bild först.");
    return;
  }

  useButton.disabled = true;

  try {
    await api.setProfilePicture(
      currentRegistration.cardGuid,
      selectedProfilePictureFile,
    );
    await initializeRegistrationFinishedSubPage();
    goToRegistrationSubPage(registrationSubPages.finished);
  } catch (err) {
    alert("Kunde inte spara profilbild. Försök igen.");
    throw err;
  } finally {
    useButton.disabled = false;
  }
}

async function skipProfilePicture() {
  clearSelectedProfilePicture();
  await initializeRegistrationFinishedSubPage();
  goToRegistrationSubPage(registrationSubPages.finished);
}

function clearSelectedProfilePicture() {
  const photo = dom.pfpPage.photo;
  const fileInput = dom.pfpPage.fileInput;
  const chooseButton = dom.pfpPage.chooseButton;
  const clearButton = dom.pfpPage.clearButton;
  const useButton = dom.pfpPage.useButton;

  if (selectedProfilePictureUrl) {
    URL.revokeObjectURL(selectedProfilePictureUrl);
    selectedProfilePictureUrl = null;
  }

  selectedProfilePictureToken += 1;
  selectedProfilePictureFile = null;

  if (fileInput) {
    fileInput.value = "";
  }

  photo.src = "";
  photo.hidden = true;
  chooseButton.hidden = false;
  clearButton.hidden = true;
  useButton.hidden = true;
}

async function cropProfilePicture(file) {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  canvas.width = profilePictureSize;
  canvas.height = profilePictureSize;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    profilePictureSize,
    profilePictureSize,
  );

  const blob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", 0.9);
  });

  if (!blob) {
    throw new Error("Could not create cropped image blob");
  }

  const croppedFile = new File([blob], `${currentRegistration.cardGuid}.jpg`, {
    type: "image/jpeg",
  });

  return {
    file: croppedFile,
    url: URL.createObjectURL(blob),
  };
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image"));
    };

    image.src = objectUrl;
  });
}

async function register(event) {
  event.preventDefault();

  const form = dom.basicInfoPage.form;
  const usernameField = dom.basicInfoPage.username;
  const programField = dom.basicInfoPage.program;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!registrationNamePattern.test(usernameField.value)) {
    usernameField.setCustomValidity(
      "Användarnamnet måste vara 3-36 tecken och bara innehålla bokstäver, siffror samt å, ä, ö.",
    );
    form.reportValidity();
    usernameField.setCustomValidity("");
    return;
  }

  if (!programField.value) {
    programField.setCustomValidity("Du måste välja ett program.");
    form.reportValidity();
    programField.setCustomValidity("");
    return;
  }

  const data = {
    username: usernameField.value,
    program: programField.value,
    id: currentRegistration.id,
  };

  try {
    const response = await api.register(data.id, data.username, data.program);
    currentRegisteredUser = response.body;
    initializeRegistrationProfilePictureSubPage();
    goToRegistrationSubPage(registrationSubPages.profilePicture);
  } catch (error) {
    alert("Kunde inte registrera spelare.");
    console.error(error);
    throw error;
  }
}

async function initialize() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const baseUrl = urlParams.get("api");

  api = new ApiClient(baseUrl);

  try {
    const response = await api.getRegistration(id);
    currentRegistration = response.body;
    initializeRegistrationBasicInfoSubPage();
    goToRegistrationSubPage(registrationSubPages.basicInformationForm);
  } catch (error) {
    goToRegistrationSubPage(registrationSubPages.invalidCode);
  }
}

let api;

dom.basicInfoPage.form.addEventListener("submit", register);
dom.pfpPage.useButton.addEventListener("click", useProfilePicture);
dom.pfpPage.skipButton.addEventListener("click", skipProfilePicture);

goToRegistrationSubPage(registrationSubPages.loading);
initialize();
