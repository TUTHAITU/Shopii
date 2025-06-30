import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:9999",
  headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
});

export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export default api;
