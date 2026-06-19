import { Lesson } from './lesson.model';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseCategory = 'frontend' | 'backend' | 'devops' | 'mobile';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  imageUrl: string;
  level: CourseLevel;
  category: CourseCategory;
  lessons: Lesson[];
  durationMinutes: number;
  rating: number;
  enrolledCount: number;
}