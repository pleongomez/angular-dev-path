export type LessonType = 'video' | 'article' | 'quiz';

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  type: LessonType;
  completed: boolean;
}