import axios from 'axios';

const API = 'https://api2.arduino.cc/iot';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 30_000) return cachedToken;
  const res = await axios.post('https://api2.arduino.cc/iot/v1/clients/token', new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: process.env.ARDUINO_REFRESH_TOKEN,
    client_id: process.env.ARDUINO_CLIENT_ID,
    client_secret: process.env.ARDUINO_CLIENT_SECRET
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }});
  cachedToken = res.data.access_token;
  tokenExpiresAt = Date.now() + (res.data.expires_in || 900) * 1000;
  return cachedToken;
}

async function authHeaders() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

async function getThingProperties(thingId) {
  const headers = await authHeaders();
  const { data } = await axios.get(`${API}/v2/things/${thingId}/properties`, { headers });
  return data;
}

async function getPropertyByName(thingId, name) {
  const list = await getThingProperties(thingId);
  return list.find(p => (p && (p.name === name || p.variable_name === name)));
}

async function getPropertyValue(propertyId) {
  const headers = await authHeaders();
  const { data } = await axios.get(`${API}/v2/properties/${propertyId}`, { headers });
  return data.last_value;
}

async function setPropertyValue(propertyId, value) {
  const headers = await authHeaders();
  const body = { value };
  await axios.put(`${API}/v2/properties/${propertyId}/publish`, body, { headers: { ...headers, 'Content-Type': 'application/json' } });
  return true;
}

export async function fetchGasAndMotor() {
  const thingId = process.env.ARDUINO_THING_ID;
  if (!thingId) throw new Error('ARDUINO_THING_ID missing');
  const gasProp = await getPropertyByName(thingId, 'gasLevel');
  const motorProp = await getPropertyByName(thingId, 'motorState');
  if (!gasProp || !motorProp) throw new Error('gasLevel or motorState property not found');
  const [gasLevel, motorState] = await Promise.all([
    getPropertyValue(gasProp.id),
    getPropertyValue(motorProp.id)
  ]);
  return { gasLevel: Number(gasLevel), motorState: Boolean(motorState), gasPropertyId: gasProp.id, motorPropertyId: motorProp.id };
}

export async function setMotorState(desired) {
  const thingId = process.env.ARDUINO_THING_ID;
  const motorProp = await getPropertyByName(thingId, 'motorState');
  if (!motorProp) throw new Error('motorState property not found');
  await setPropertyValue(motorProp.id, Boolean(desired));
}

