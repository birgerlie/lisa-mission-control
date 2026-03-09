# Webhook Setup for Mission Control

## 🎯 Overview

Mission Control can send webhooks when tasks are created, updated, or changed status.

## 🔗 Webhook URL

**Production:** `https://lisa-mission-control-949fdvl40-birgerlies-projects.vercel.app/api/webhook/receive`

**Secret:** `1b8032a7d768668f4b68d35f1101a618dcb5c7497650e843816296703f0ebe70`

---

## 📤 Sending Webhooks FROM Mission Control

When a task is created in Mission Control, it automatically sends a webhook to the configured WEBHOOK_URL.

### Webhook Payload Format

```json
{
  "taskId": "uuid-of-task",
  "title": "Task title",
  "description": "Task description",
  "priority": "high|medium|low",
  "assignee": "Lisa",
  "status": "backlog|in-progress|review|done",
  "createdAt": "2026-03-09T19:15:52.613+00:00"
}
```

### Headers

```
Content-Type: application/json
Authorization: Bearer 1b8032a7d768668f4b68d35f1101a618dcb5c7497650e843816296703f0ebe70
X-Webhook-Source: mission-control
```

---

## 📥 Receiving Webhooks IN Mission Control

To update a task status via webhook:

### Endpoint

`POST https://lisa-mission-control-949fdvl40-birgerlies-projects.vercel.app/api/webhook/receive`

### Authentication

```
Authorization: Bearer 1b8032a7d768668f4b68d35f1101a618dcb5c7497650e843816296703f0ebe70
```

### Request Body

```json
{
  "taskId": "uuid-of-task",
  "status": "done"
}
```

### Example cURL

```bash
curl -X POST "https://lisa-mission-control-949fdvl40-birgerlies-projects.vercel.app/api/webhook/receive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1b8032a7d768668f4b68d35f1101a618dcb5c7497650e843816296703f0ebe70" \
  -d '{"taskId":"ea7a0152-b4ac-4c0c-a2d9-a5590a0618d9","status":"done"}'
```

### Valid Status Values

- `backlog`
- `in-progress`
- `review`
- `done`

---

## 🔄 Webhook Flow

```
┌─────────────────┐     Create Task      ┌──────────────────┐
│  Clawdbot/Lisa  │ ───────────────────> │  Mission Control │
│                 │                      │                  │
│                 │ <─────────────────── │                  │
│                 │   Webhook (new task) │                  │
└─────────────────┘                      └──────────────────┘
         │                                         │
         │  Update status via webhook              │
         │ <──────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Task completed │
└─────────────────┘
```

---

## 🧪 Testing Webhooks

### Test 1: Health Check

```bash
curl "https://lisa-mission-control-949fdvl40-birgerlies-projects.vercel.app/api/webhook/receive" \
  -H "Authorization: Bearer 1b8032a7d768668f4b68d35f1101a618dcb5c7497650e843816296703f0ebe70"
```

Expected response:
```json
{"status":"ok","authenticated":true,"timestamp":"2026-03-09T19:19:10.364Z"}
```

### Test 2: Update Task Status

```bash
curl -X POST "https://lisa-mission-control-949fdvl40-birgerlies-projects.vercel.app/api/webhook/receive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1b8032a7d768668f4b68d35f1101a618dcb5c7497650e843816296703f0ebe70" \
  -d '{"taskId":"YOUR-TASK-ID","status":"done"}'
```

---

## 📝 Notes

- Webhooks are sent asynchronously (don't block task creation)
- Failed webhooks are retried via the polling mechanism
- All webhook attempts are logged in the `webhook_logs` table
- Rate limiting: 60 requests per minute per IP

---

## 🔐 Security

- All webhooks require Bearer token authentication
- Tokens are stored encrypted in Vercel environment variables
- WEBHOOK_SECRET is shared between sender and receiver
