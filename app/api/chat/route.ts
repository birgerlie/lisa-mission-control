import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getSmartResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('task') || lower.includes('todo')) {
    const responses = [
      "I can help you manage tasks! You can view all current tasks on the Task Board, create new ones, or update their status. Would you like me to walk you through anything specific?",
      "Looking at the task board, I'd suggest prioritizing any items in the 'review' column first. Want me to summarize the current task breakdown?",
      "For task management, I recommend breaking work into small, actionable items. You can assign priorities (high, medium, low) and track them through backlog, in-progress, review, and done stages.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lower.includes('status') || lower.includes('how')) {
    const responses = [
      "Everything is running smoothly! All systems are operational and the dashboard is up to date. Is there a specific area you'd like a deeper status report on?",
      "Current status: all services are healthy, the task pipeline is flowing, and no critical issues detected. Let me know if you need details on a specific project.",
      "Here's a quick overview: systems are green across the board. The team has been making good progress on active tasks. Anything specific you'd like to check on?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  if (lower.includes('help')) {
    return "Here's what I can help you with:\n\n" +
      "- **Task Management** - Create, update, and track tasks\n" +
      "- **Project Overview** - Get status updates on projects\n" +
      "- **Team Coordination** - Check team workload and assignments\n" +
      "- **System Health** - Monitor dashboard and service status\n" +
      "- **Search** - Find anything across the mission control\n\n" +
      "Just ask me anything and I'll do my best to assist!";
  }

  const defaults = [
    "That's a great point! I'm here to help you stay on top of everything in mission control. What would you like to dive into?",
    "I appreciate you reaching out! Whether it's tasks, projects, or team coordination, I'm ready to assist. What's on your mind?",
    "Thanks for the message! I'm always here to help. Feel free to ask about tasks, system status, or anything else you need.",
    "Got it! Let me know if there's anything specific you'd like me to look into. I can help with tasks, projects, team updates, and more.",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simulate thinking delay (500-1500ms)
    const delay = 500 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const response = getSmartResponse(body.message);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
