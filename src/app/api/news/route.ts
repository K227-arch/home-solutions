import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = Math.max(1, Math.min(20, parseInt(limitParam || '5', 10) || 5));

    const now = new Date();
    const makeLexical = (text: string) => ({
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ text }],
          },
        ],
      },
    });

    const sample = [
      {
        id: 1,
        title: 'Welcome to Tenure — Program Updates',
        content: makeLexical('We are excited to introduce improvements to the Tenure rewards program.'),
        publish_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'Normal',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 2,
        title: 'System Maintenance Scheduled',
        content: makeLexical('Scheduled maintenance will occur this weekend to improve system reliability.'),
        publish_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'High',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 3,
        title: 'Security Advisory',
        content: makeLexical('Please enable MFA in your account settings to enhance security.'),
        publish_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'Urgent',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 4,
        title: 'New Features Rolling Out',
        content: makeLexical('We are rolling out new dashboard widgets next week.'),
        publish_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'Low',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 5,
        title: 'Policy Update Notice',
        content: makeLexical('Our terms of service have been updated. Please review the changes.'),
        publish_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'Normal',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];

    return NextResponse.json({ success: true, data: sample.slice(0, limit) }, { status: 200 });
  } catch (err) {
    console.error('News API error', err);
    return NextResponse.json({ success: false, error: 'Failed to load news' }, { status: 500 });
  }
}