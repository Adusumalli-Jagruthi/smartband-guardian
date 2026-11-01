# SmartBand Guardian

Build a complete, responsive frontend for SmartBand – AI + IoT Safety System for School Kids and Elderly People.

Tech: React + Vite, Tailwind CSS, React Router, Lucide React, Recharts, Leaflet, Axios.

Design: Premium modern dashboard, white/light background, navy text, teal accents, clean cards, professional typography, responsive sidebar and mobile layout.

Pages:

Landing page

Login and registration with role selection

School Kid dashboard

Elderly dashboard

Guardian dashboard

GPS tracking and history

Health/activity charts

Medicine schedules and confirmation

Multilingual AI chatbot/voice interface

SOS alerts and notifications

Device management

Integration settings and profile

Dashboard features:

School Kid: heart rate, GPS, activity, SOS and history.

Elderly: heart rate, activity, medicine reminders, SOS and AI assistant.

Guardian: linked users, health status, GPS, medicine confirmations and alerts.

Hardware: ESP32-C3 Mini, NEO-6M GPS, actual pulse heart-rate sensor (not MAX30102), MPU6050, SOS button, buzzer and LiPo battery.

Restrictions: No SIM, SpO2 or temperature readings.

API preparation:
Create centralized Axios services for authentication, users, devices, sensors, GPS, medicines, alerts, guardian dashboard and AI. Use VITE_API_BASE_URL for backend connection.

Important:

Frontend only. Backend will be developed separately.

Never fabricate sensor readings or GPS locations.

Show "Waiting for device data" when unavailable.

Show "Device not connected" when offline.

Do not expose API keys.

Use reusable components and avoid unnecessary dependencies.

Do not use Firebase or Supabase.

Do not stop after creating the landing page.

Complete all pages, navigation, responsive design and API integration structure. Ensure npm run dev and npm run build work.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/62c71ccb-7836-46a7-8057-b872ccdce221).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
