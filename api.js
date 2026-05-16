class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  valuateResponseSuccess(response) {
    switch (response.status) {
      case 404:
      case 400:
      case 0:
        throw new Error(response.status + response.statusText);
        break;
    }
  }

  async get(endpoint) {
    const response = await fetch(this.baseUrl + endpoint);
    this.valuateResponseSuccess(response);

    const body = await response.json();
    return { body: body, status: response.status };
  }

  async post(endpoint, postBody) {
    const response = await fetch(this.baseUrl + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postBody),
    });

    this.valuateResponseSuccess(response);

    const body = await response.json();
    return { body: body, status: response.status };
  }

  async postPhoto(endpoint, photo) {
    const formData = new FormData();
    const fileName = photo?.name ?? "unknown.png";
    formData.append("file", photo, fileName);

    const response = await fetch(this.baseUrl + endpoint, {
      method: "POST",
      body: formData,
    });

    this.valuateResponseSuccess(response);

    return { status: response.status };
  }

  url(endpoint) {
    return this.baseUrl + endpoint;
  }

  async getUserWithId(id) {
    const result = await this.get("users/id/" + id);
    return result;
  }

  getUserProfilePictureUrl(id) {
    return this.url("users/" + id + "/profilePicture");
  }

  async register(guid, username, program) {
    return this.post("users/register", {
      registrationGuid: guid,
      username: username,
      schoolProgram: parseInt(program),
    });
  }

  async setProfilePicture(guid, photo) {
    return this.postPhoto("users/" + guid + "/setProfilePicture", photo);
  }

  async getRegistration(id) {
    return this.get("users/registrations/" + id);
  }
}
