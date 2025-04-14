'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'

interface DocumentationSection {
  id: number;
  title: string;
  content: string;
  slug: string;
  parentSectionId: number | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, {
      allowDangerousHtml: true
    })
    .use(rehypeRaw)
    .use(rehypeHighlight)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);

  return result.toString();
}

export default function DocContent() {
  const searchParams = useSearchParams();
  const sectionSlug = searchParams.get('section');
  
  const [content, setContent] = useState<DocumentationSection | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchContent() {
      setIsLoading(true);
      try {
        const apiUrl = sectionSlug 
          ? `/api/docs/section?slug=${encodeURIComponent(sectionSlug)}`
          : '/api/docs/section';
          
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          setContent(data);
          
          if (data?.content) {
            const html = await markdownToHtml(data.content);
            setHtmlContent(html);
          }
        } else {
          console.error('Failed to fetch documentation');
          setHtmlContent('<p>Error loading documentation content.</p>');
        }
      } catch (error) {
        console.error('Error:', error);
        setHtmlContent('<p>An unexpected error occurred.</p>');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchContent();
  }, [sectionSlug]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <article>
      <h1>{content?.title || 'Welcome to Documentation'}</h1>
      <div className="markdown-content">
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <p>Here you'll find all the information you need about our product.</p>
        )}
      </div>
    </article>
  );
}