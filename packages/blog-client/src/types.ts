export interface Post {
  id: string;
  slug: string;
  title: string;
  status: string;
  collectionId: string;
  created_at: number;
  updated_at: number;
  data: {
    title: string;
    slug: string;
    content: string; // JSON-encoded lexical tree — parse before rendering
    author: string;
    publishedAt: string;
  };
}

export interface ContentResponse {
  data: Post[];
  meta: { count: number };
}
