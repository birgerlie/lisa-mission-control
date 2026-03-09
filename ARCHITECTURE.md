# Mission Control - Webhook + Polling Architecture

## Hybrid Approach (Best of Both Worlds)

```
┌─────────────────┐         Webhook (instant)        ┌─────────────────┐
│   Birger        │  ───────────────────────────────►  │   Lisa (me)     │
│   Creates task  │                                    │   MacBook Pro   │
│   on Vercel     │                                    │   (Port 18789)  │
└─────────────────┘                                    └─────────────────┘
         │                                                      │
         │         ┌─────────────────────┐                     │
         │         │   WEBHOOK SUCCESS   │                     │
         │         │   Task executed     │                     │
         │         └─────────────────────┘                     │
         │                                                      │
         │         ┌─────────────────────┐                     │
         └────────►│   WEBHOOK FAILED    │                     │
                   │   (Mac offline)     │                     │
                   └─────────────────────┘                     │
                          │                                    │
                          ▼                                    │
                   ┌─────────────────────┐                    │
                   │   POLLING BACKUP    │◄───────────────────┘
                   │   (Every 5 min)     │   Check for pending
                   └─────────────────────┘   tasks
                          │
                          ▼
                   ┌─────────────────────┐
                   │   Execute stranded  │
                   │   tasks             │
                   └─────────────────────┘
```

## Flow

### 1. Normal Flow (Webhook Success)
```
1. Birger clicks "New Task" on Vercel
2. Vercel sends webhook POST to http://birger-macbook:18789/webhook/task
3. I receive immediately and execute
4. I update task status to "done" via API
```

### 2. Fallback Flow (Webhook Fails)
```
1. Birger clicks "New Task" on Vercel
2. Vercel tries webhook → FAILS (Mac offline)
3. Task stays in "pending" state
4. Every 5 minutes, I poll: GET /api/tasks/pending
5. I find the stranded task and execute
6. Mark as done
```

## API Endpoints Needed

### Vercel (Mission Control) exposes:

```typescript
// 1. Webhook receiver (on my Mac)
POST http://birger-macbook:18789/webhook/task
Body: { taskId, title, description, priority }

// 2. Get pending tasks (for polling)
GET https://mission-control.vercel.app/api/tasks/pending
Response: { tasks: [...] }

// 3. Update task status
POST https://mission-control.vercel.app/api/tasks/update
Body: { taskId, status, completedAt }

// 4. Get task history
GET https://mission-control.vercel.app/api/tasks/history
```

## Implementation Plan

### Phase 1: Webhook (Fast path)
- [ ] Add webhook endpoint to Mission Control
- [ ] Configure clawdbot gateway to receive webhooks
- [ ] Test instant task creation → execution

### Phase 2: Polling (Backup)
- [ ] Add cron job: check pending tasks every 5 min
- [ ] Query Vercel API for tasks older than 1 min
- [ ] Execute and mark as done

### Phase 3: Error Handling
- [ ] Retry logic for failed webhooks
- [ ] Dead letter queue for repeatedly failed tasks
- [ ] Notification if task fails after 3 attempts

## Webhook Payload Example

```json
{
  "event": "task.created",
  "timestamp": "2026-03-09T14:30:00Z",
  "task": {
    "id": "task-123",
    "title": "Analyze competitor data",
    "description": "Research Prima Ferdighekk pricing",
    "priority": "high",
    "assignee": "Lisa",
    "createdBy": "birgerlie",
    "createdAt": "2026-03-09T14:30:00Z"
  },
  "callbackUrl": "https://mission-control.vercel.app/api/tasks/webhook-callback"
}
```

## Polling Logic

```typescript
// Runs every 5 minutes via cron
async function pollPendingTasks() {
  const response = await fetch('https://mission-control.vercel.app/api/tasks/pending');
  const { tasks } = await response.json();
  
  // Filter: only tasks older than 2 minutes (webhook had chance)
  const strandedTasks = tasks.filter(t => 
    t.status === 'pending' && 
    isOlderThan(t.createdAt, '2 minutes')
  );
  
  for (const task of strandedTasks) {
    console.log(`Found stranded task via polling: ${task.id}`);
    await executeTask(task);
    await markTaskComplete(task.id);
  }
}
```

## Security

```typescript
// Webhook authentication
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifyWebhookSignature(payload, signature) {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === expected;
}
```

## Status Codes

| Status | Meaning |
|--------|---------|
| `pending` | Waiting for pickup |
| `processing` | I received it, working on it |
| `done` | Completed successfully |
| `failed` | Error occurred |
| `stranded` | Webhook failed, picked up by polling |

## Next Steps

1. Set up webhook endpoint in Mission Control
2. Configure clawdbot gateway to receive external webhooks
3. Add polling cron job
4. Test both paths (webhook success + webhook failure → polling)

---

*Architecture document for Mission Control v2.0*
