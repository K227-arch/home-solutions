'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type NewsItem = {
  id: string;
  title: string;
  content: string;
  published: boolean;
  scheduled_at?: string | null;
  created_at: string;
};

export default function EngagementManagement() {
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [published, setPublished] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'scheduled'>('all');
  const [message, setMessage] = useState('');

  const exec = (cmd: string) => document.execCommand(cmd, false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        let query = supabase
          .from('news')
          .select('id,title,content,published,scheduled_at,created_at')
          .order('created_at', { ascending: false })
          .limit(100);
        if (filter === 'published') query = query.eq('published', true);
        if (filter === 'scheduled') query = query.not('scheduled_at', 'is', null);
        const { data, error } = await query;
        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.warn('No news data available yet.');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, [filter]);

  const onSave = async () => {
    try {
      setMessage('');
      const content = editorRef.current?.innerHTML || '';
      const { error } = await supabase.from('news').insert({
        title,
        content,
        published,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      if (error) throw error;
      setTitle('');
      setScheduledAt('');
      setPublished(false);
      if (editorRef.current) editorRef.current.innerHTML = '';
      setMessage('News item saved.');
    } catch (err) {
      console.error('Error saving news:', err);
      setMessage('Failed to save news item.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Engagement Management</h1>
      </div>

      {message && (
        <div className="mb-4 rounded border border-blue-300 bg-blue-50 text-blue-800 p-3">{message}</div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create News Feed Post</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            <span>Publish now</span>
          </label>
        </div>
        <div className="mb-2 flex items-center space-x-2">
          <button onClick={() => exec('bold')} className="px-2 py-1 bg-gray-200 rounded">Bold</button>
          <button onClick={() => exec('italic')} className="px-2 py-1 bg-gray-200 rounded">Italic</button>
          <button onClick={() => exec('underline')} className="px-2 py-1 bg-gray-200 rounded">Underline</button>
          <button onClick={() => exec('insertUnorderedList')} className="px-2 py-1 bg-gray-200 rounded">• List</button>
          <button onClick={() => exec('insertOrderedList')} className="px-2 py-1 bg-gray-200 rounded">1. List</button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          className="min-h-[200px] border border-gray-300 rounded-md p-3 focus:outline-none"
        />
        <div className="mt-4">
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Post</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Existing Posts</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">No posts found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map(item => (
              <li key={item.id} className="py-3">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: item.content }} />
                  </div>
                  <div className="text-right text-sm">
                    <div className="mb-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {item.scheduled_at && (
                      <div className="text-gray-600">Scheduled: {new Date(item.scheduled_at).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}