const dom = {
  container: document.getElementById("registration"),
  basicInfoPage: {
    container: document.getElementById("registrationBasicInfoPage"),
    form: document.getElementById("registerForm"),
    username: document.getElementById("registerUsername"),
    program: document.getElementById("registerProgram"),
    content: document.getElementById("registerTermsContent"),
    cancel: document.getElementById("registerCancel"),
  },
  pfpPage: {
    container: document.getElementById("registrationPfpPage"),
    fileInput: document.getElementById("registration-pfp-input"),
    photo: document.getElementById("registration-pfp-photo"),
    chooseButton: document.getElementById("registration-pfp-choose-button"),
    clearButton: document.getElementById("registration-pfp-clear-button"),
    useButton: document.getElementById("registration-pfp-use"),
    skipButton: document.getElementById("registration-pfp-skip"),
  },
  finishPage: {
    container: document.getElementById("registration-finish-page"),
    name: document.getElementById("registration-finish-name"),
    pfp: document.getElementById("registration-finish-pfp"),
    program: document.getElementById("registration-finish-program"),
  },
  invalidCode: {
    container: document.getElementById("registration-invalid-code-page"),
  },
  loading: {
    container: document.getElementById("registration-loading-page"),
  },
};
