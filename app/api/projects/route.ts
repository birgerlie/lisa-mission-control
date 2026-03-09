import { NextRequest, NextResponse } from 'next/server';
import { projectDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projects = await projectDb.getAll();
    const mapped = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      progress: p.progress,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      taskCount: p.task_count,
    }));
    return NextResponse.json({ success: true, projects: mapped });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
    }
    const project = await projectDb.create({
      name: body.name.trim(),
      description: body.description?.trim(),
      status: body.status,
    });
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        taskCount: 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }
}
