import axios from "axios";

axios.defaults.baseURL = "http://127.0.0.1:8000";

// Set token if exists
const token = localStorage.getItem("access");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default axios;
