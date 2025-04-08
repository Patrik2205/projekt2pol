import { prisma } from '@/app/api/lib/prisma'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { ReactElement } from 'react'

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

async function getDocContent(slug?: string): Promise<DocumentationSection | null> {
  if (slug) {
    return await prisma.documentationSection.findFirst({
      where: {
        slug: slug
      }
    });
  }
 
  return await prisma.documentationSection.findFirst({
    where: {
      parentSectionId: null
    },
    orderBy: {
      orderIndex: 'asc'
    }
  });
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

interface DocsPageProps {
  searchParams: { 
    section?: string 
  };
}

export default async function DocsPage({ 
  searchParams 
}: DocsPageProps): Promise<ReactElement> {
  const content = await getDocContent(searchParams.section);
  
  let htmlContent = '';
  if (content?.content) {
    try {
      htmlContent = await markdownToHtml(content.content);
    } catch (error) {
      console.error('Error processing markdown:', error);
      htmlContent = '<p>Došlo k chybě při zpracování obsahu.</p>';
    }
  }

  return (
    <article className="prose prose-lg dark:prose-invert max-w-none px-8">
      <h1>{content?.title || 'Vítejte v dokumentaci'}</h1>
      <div className="markdown-content">
        {htmlContent ? (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ) : (
          <p>Zde najdete všechny potřebné informace o našem produktu.</p>
        )}
      </div>
    </article>
  );
}