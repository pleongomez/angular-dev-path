import { Course } from './course.model';

export interface Enrollment {
  id: string;
  userId: string;
  course: Course;
  enrolledAt: Date;
  completedLessonIds: string[];
  progressPercent: number;
}