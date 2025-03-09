const apiUrl = "http://127.0.0.1:5000";

let userId = null;

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    userId = data.userId;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("user-section").style.display = "block";
    getProfile();
  } else {
    alert(data.message);
  }
}

async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch(`${apiUrl}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  alert(data.message);
}

async function getProfile() {
  const response = await fetch(`${apiUrl}/user/profile`);
  const data = await response.json();
  document.getElementById("profile-info").innerHTML = `
        <p>Username: ${data.username}</p>
        <p>Credits: ${data.credits}</p>
    `;
}

async function uploadDocument() {
  const fileInput = document.getElementById("document-upload");
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("document", file);

  const response = await fetch(`${apiUrl}/scanUpload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  alert(data.message);
}
