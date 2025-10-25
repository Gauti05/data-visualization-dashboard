
import axios from 'axios';

const API_URL = 'http://localhost:8000'; 

export async function signup(email, password) {
  return axios.post(`${API_URL}/signup`, { email, password });
}

export async function login(email, password) {
  return axios.post(`${API_URL}/login`, { email, password });
}
