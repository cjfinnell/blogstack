export type PostType = 'essay' | 'review';

export interface ReviewMeta {
  restaurant?: string;
  city?: string;
  visitedAt?: string;
  rating?: number;
  ratingScaleMax?: number;
  pricePerPerson?: number;
  verdictSummary?: string;
  recommendation?: string;
  bestOccasion?: string;
  bestDishes?: string;
  cuisineTags?: string[];
  photos?: string[];
}

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
    // Absent on every row written before the review post type existed.
    postType?: PostType;
    review?: ReviewMeta;
  };
}

export interface ContentResponse {
  data: Post[];
  meta: { count: number };
}
