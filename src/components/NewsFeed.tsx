'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NewsPost {
  id: number
  title: string
  content: any // Lexical JSON format
  publish_date: string
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  createdAt: string
  updatedAt: string
}

interface NewsFeedProps {
  limit?: number
  className?: string
}

export function NewsFeed({ limit = 5, className = '' }: NewsFeedProps) {
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true)
        const origin = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, '')
        const url = `${origin || ''}/api/news?limit=${limit}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch news')
        }

        const result = await response.json()

        if (result.success) {
          setPosts(result.data)
        } else {
          throw new Error(result.error || 'Failed to load news')
        }
      } catch (err: any) {
        console.error('Error fetching news:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [limit])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'destructive'
      case 'High':
        return 'default'
      case 'Low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  // Simple function to extract text from Lexical JSON
  const extractTextFromLexical = (content: any): string => {
    if (!content) return ''

    try {
      // Lexical stores content in root.children
      const root = content.root || content
      if (root.children && Array.isArray(root.children)) {
        return root.children
          .map((node: any) => {
            if (node.children && Array.isArray(node.children)) {
              return node.children
                .map((child: any) => child.text || '')
                .join('')
            }
            return node.text || ''
          })
          .join(' ')
          .trim()
      }
      return ''
    } catch (error) {
      console.error('Error parsing Lexical content:', error)
      return 'Content unavailable'
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className={`p-4 border-red-200 ${className}`}>
        <p className="text-red-600 text-sm">Failed to load news: {error}</p>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className={`p-6 text-center ${className}`}>
        <p className="text-gray-500">No news posts available at this time.</p>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map((post) => (
        <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{post.title}</h3>
            {post.priority !== 'Normal' && (
              <Badge variant={getPriorityColor(post.priority)}>
                {post.priority}
              </Badge>
            )}
          </div>

          <p className="text-gray-700 text-sm mb-3 line-clamp-3">
            {extractTextFromLexical(post.content)}
          </p>

          <div className="flex items-center text-xs text-gray-500">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(post.publish_date)}
          </div>
        </Card>
      ))}
    </div>
  )
}
