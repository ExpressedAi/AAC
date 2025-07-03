import { SearchResult } from '../types';

const TAVILY_API_KEY = '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';
const FIRECRAWL_API_KEY = 'fc-b61ab628e25f4270ad0bcdd2c55700c2';

class SearchService {
  async searchWeb(query: string, config?: any): Promise<SearchResult[]> {
    const searchConfig = {
      searchDepth: config?.searchDepth || 'advanced',
      maxResults: config?.maxResults || 10,
      includeImages: config?.includeImages || false,
      includeAnswer: config?.includeAnswer || true,
      ...config
    };

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TAVILY_API_KEY}`
        },
        body: JSON.stringify({
          query,
          search_depth: searchConfig.searchDepth,
          include_answer: searchConfig.includeAnswer,
          include_images: searchConfig.includeImages,
          include_raw_content: true,
          max_results: searchConfig.maxResults
        })
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score
      }));
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async crawlUrl(url: string, config?: any): Promise<string> {
    const scrapingConfig = {
      onlyMainContent: config?.onlyMainContent ?? true,
      timeout: config?.timeout || 30000,
      includeTags: config?.includeTags || [],
      excludeTags: config?.excludeTags || ['nav', 'footer', 'sidebar'],
      ...config
    };

    try {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          pageOptions: {
            onlyMainContent: scrapingConfig.onlyMainContent,
            timeout: scrapingConfig.timeout,
            includeTags: scrapingConfig.includeTags,
            excludeTags: scrapingConfig.excludeTags
          },
          formats: config?.contentFormats || ['markdown']
        })
      });

      if (!response.ok) {
        throw new Error(`Crawl API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.content || '';
    } catch (error) {
      console.error('Crawl error:', error);
      return '';
    }
  }

  async batchCrawl(urls: string[], config?: any): Promise<{ url: string; content: string }[]> {
    const results = await Promise.all(
      urls.map(async (url) => ({
        url,
        content: await this.crawlUrl(url, config)
      }))
    );
    return results;
  }
}

export const searchService = new SearchService();