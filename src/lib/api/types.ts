export type Role = "kid" | "elderly" | "guardian";

export interface User { id: string; name: string; email: string; role: Role; phone?: string; language?: string }
export interface AuthResponse { token: string; user: User }

/** Only sensors present on the band: pulse sensor (BPM) + MPU6050 (motion). No SpO2 / temperature. */
export interface SensorReading {
  timestamp: string;
  heartRate: number | null;
  steps: number | null;
  activity: "resting" | "walking" | "running" | "fall" | null;
  battery: number | null;
}

export interface GpsPoint { lat: number; lng: number; timestamp: string; accuracy?: number }

export interface Device {
  id: string;
  name: string;
  assignedTo?: string;
  status: "online" | "offline";
  battery: number | null;
  lastSeen: string | null;
  firmware?: string;
}

export interface Medicine {
  id: string; name: string; dosage: string; time: string;
  status: "pending" | "taken" | "missed";
  confirmedAt?: string | null;
}

export interface Alert {
  id: string; userId: string; userName?: string;
  type: "sos" | "fall" | "heart_rate" | "medicine" | "device";
  message: string; timestamp: string; acknowledged: boolean;
  location?: { lat: number; lng: number } | null;
}

export interface LinkedUser {
  id: string; name: string; role: Exclude<Role, "guardian">;
  device?: Device | null; latest?: SensorReading | null; location?: GpsPoint | null;
  pendingMedicines?: number;
}

export interface ChatReply { reply: string; language: string }

export type IntegrationName = "thingspeak" | "telegram" | "ai";
export type IntegrationStatus = "connected" | "disconnected" | "error" | "not_configured";

/** Backend never returns full secrets — only masked hints like "••••a1b2". */
export interface IntegrationConfig {
  configured: boolean;
  enabled: boolean;
  status: IntegrationStatus;
  fields: Record<string, string>;          // non-secret values (channelId, chatId, provider, model)
  maskedSecrets: Record<string, string>;   // e.g. { readApiKey: "••••a1b2" }
  lastSuccessAt?: string | null;           // last sync / last notification
  lastMessage?: string | null;             // last test / notification result text
}
export interface IntegrationTestResult { ok: boolean; message: string; testedAt: string }
