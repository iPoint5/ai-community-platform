export type UserRole = 'industry_expert' | 'ai_developer' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  createdAt: string;
}

export type TopicType = 'pain_point' | 'ai_insight';

export interface Topic {
  id: string;
  authorUid: string;
  authorName: string;
  title: string;
  content: string;
  type: TopicType;
  industry?: string;
  tags: string[];
  viewCount: number;
  commentCount: number;
  createdAt: any; // Firestore Timestamp or string
}

export interface Comment {
  id: string;
  topicId: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: any;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerUid: string;
  members: string[];
  status: 'planning' | 'active' | 'completed';
  relatedTopicId?: string;
  createdAt: any;
}
