export type CommandType = '/create-post' | '/templates' | '/platforms' | '/status' | '/help';

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  command?: CommandType;
}

export interface PostRequest {
  postType: string;
  postDetails: string;
  targetPlatforms: string[];
  companyTone: string;
  canvaTemplateLink: string;
  notificationEmail?: string;
}
