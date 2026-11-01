import { api } from "./client";
import type {
  Alert, AuthResponse, IntegrationConfig, IntegrationName, IntegrationTestResult, ChatReply, Device, GpsPoint, LinkedUser, Medicine, Role, SensorReading, User,
} from "./types";

const d = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const authService = {
  login: (body: { email: string; password: string; role: Role }) => d<AuthResponse>(api.post("/auth/login", body)),
  register: (body: { name: string; email: string; password: string; role: Role; phone?: string }) =>
    d<AuthResponse>(api.post("/auth/register", body)),
  me: () => d<User>(api.get("/auth/me")),
  logout: () => d<void>(api.post("/auth/logout")),
};

export const userService = {
  get: (id: string) => d<User>(api.get(`/users/${id}`)),
  update: (id: string, body: Partial<User>) => d<User>(api.put(`/users/${id}`, body)),
};

export const deviceService = {
  list: () => d<Device[]>(api.get("/devices")),
  get: (id: string) => d<Device>(api.get(`/devices/${id}`)),
  pair: (body: { deviceId: string; name: string; assignedTo?: string }) => d<Device>(api.post("/devices", body)),
  remove: (id: string) => d<void>(api.delete(`/devices/${id}`)),
  testBuzzer: (id: string) => d<void>(api.post(`/devices/${id}/buzzer`)),
};

export const sensorService = {
  latest: (userId: string) => d<SensorReading | null>(api.get(`/sensors/${userId}/latest`)),
  history: (userId: string, range: "day" | "week") =>
    d<SensorReading[]>(api.get(`/sensors/${userId}/history`, { params: { range } })),
};

export const gpsService = {
  latest: (userId: string) => d<GpsPoint | null>(api.get(`/gps/${userId}/latest`)),
  history: (userId: string, date?: string) => d<GpsPoint[]>(api.get(`/gps/${userId}/history`, { params: { date } })),
};

export const medicineService = {
  list: (userId: string) => d<Medicine[]>(api.get(`/medicines/${userId}`)),
  create: (userId: string, body: Omit<Medicine, "id" | "status">) => d<Medicine>(api.post(`/medicines/${userId}`, body)),
  confirm: (medicineId: string) => d<Medicine>(api.post(`/medicines/${medicineId}/confirm`)),
  remove: (medicineId: string) => d<void>(api.delete(`/medicines/${medicineId}`)),
};

export const alertService = {
  list: (userId?: string) => d<Alert[]>(api.get("/alerts", { params: { userId } })),
  acknowledge: (id: string) => d<Alert>(api.post(`/alerts/${id}/acknowledge`)),
  triggerSos: (userId: string) => d<Alert>(api.post("/alerts/sos", { userId })),
};

export const guardianService = {
  linkedUsers: () => d<LinkedUser[]>(api.get("/guardian/linked-users")),
  link: (code: string) => d<LinkedUser>(api.post("/guardian/link", { code })),
};

export const aiService = {
  /** Backend proxies to NVIDIA NIM (with configurable fallback provider). No keys in the browser. */
  chat: (body: { message: string; language: string; history: { role: "user" | "assistant"; content: string }[] }) => d<ChatReply>(api.post("/ai/chat", body)),
};

export const integrationService = {
  get: () => d<Record<string, boolean>>(api.get("/integrations")),
  update: (body: Record<string, boolean>) => d<Record<string, boolean>>(api.put("/integrations", body)),
};

/** Integration credentials are sent once to the backend, encrypted there, and never read back in full. */
export const integrationConfigService = {
  get: (name: IntegrationName) => d<IntegrationConfig>(api.get(`/integrations/${name}/config`)),
  /** Only include secret keys the user typed; omitted secrets keep their stored value. */
  save: (name: IntegrationName, body: { enabled: boolean; fields: Record<string, string>; secrets: Record<string, string> }) =>
    d<IntegrationConfig>(api.put(`/integrations/${name}/config`, body)),
  remove: (name: IntegrationName) => d<void>(api.delete(`/integrations/${name}/config`)),
  test: (name: IntegrationName) => d<IntegrationTestResult>(api.post(`/integrations/${name}/test`)),
};
