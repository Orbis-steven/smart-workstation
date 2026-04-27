import axios from 'axios';
import { WORKSTATION_API_URL } from '../../config/api';

export function getWorkstationErrorMessage(error, fallback = 'Error') {
  return error?.response?.data?.detail
    || (error?.code === 'ERR_NETWORK' ? '网络错误: 无法连接到视觉服务(8000端口)' : fallback);
}

export async function startVisionSession(payload) {
  return axios.post(`${WORKSTATION_API_URL}/event/vision_session`, payload);
}

export async function fetchVisionState() {
  const response = await fetch(`${WORKSTATION_API_URL}/state`, { method: 'GET', mode: 'cors' }).catch(() => null);
  if (!response || !response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export async function openVisionTray() {
  return axios.post(`${WORKSTATION_API_URL}/event/tray_open`);
}

export async function changeVisionMode(mode) {
  return axios.post(`${WORKSTATION_API_URL}/event/mode`, { mode });
}

export async function sendScanEvent(payload) {
  return axios.post(`${WORKSTATION_API_URL}/event/scan`, payload);
}

export async function sendPickRequest(payload) {
  return axios.post(`${WORKSTATION_API_URL}/event/pick`, payload);
}

export async function sendSensorIn() {
  return axios.post(`${WORKSTATION_API_URL}/event/sensor_in`);
}

export async function sendSensorOut() {
  return axios.post(`${WORKSTATION_API_URL}/event/sensor_out`);
}

export async function resetVisionSession() {
  return axios.post(`${WORKSTATION_API_URL}/event/reset`);
}
