import { computed, Service, signal } from '@angular/core';
import { Enrollment } from '../models/enrollment.model';
import { Course } from '../models/course.model';
import { MOCK_COURSES } from '../data/courses.data';

@Service()
export class EnrollmentService {
  // Estado privado: inscripciones del usuario actual
  private readonly _enrollments = signal<Enrollment[]>([
    {
      id: 'e1',
      userId: '1',
      course: MOCK_COURSES[0],
      enrolledAt: new Date('2026-05-10'),
      completedLessonIds: ['1-1', '1-2'],
      progressPercent: 50,
    },
    {
      id: 'e2',
      userId: '1',
      course: MOCK_COURSES[1],
      enrolledAt: new Date('2026-06-01'),
      completedLessonIds: [],
      progressPercent: 0,
    },
  ]);

  readonly enrollments = this._enrollments.asReadonly();

  // Signals derivados con computed()
  readonly totalEnrolled = computed(() => this._enrollments().length);

  readonly totalCompleted = computed(() =>
    this._enrollments().filter(e => e.progressPercent === 100).length
  );

  readonly averageProgress = computed(() => {
    const list = this._enrollments();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, e) => acc + e.progressPercent, 0);
    return Math.round(sum / list.length);
  });

  enroll(course: Course, userId: string): void {
    const alreadyEnrolled = this._enrollments().some(
      e => e.course.id === course.id && e.userId === userId
    );
    if (alreadyEnrolled) return;

    this._enrollments.update(list => [
      ...list,
      {
        id: `e${Date.now()}`,
        userId,
        course,
        enrolledAt: new Date(),
        completedLessonIds: [],
        progressPercent: 0,
      },
    ]);
  }

  completeLesson(enrollmentId: string, lessonId: string): void {
    this._enrollments.update(list =>
      list.map(e => {
        if (e.id !== enrollmentId) return e;
        if (e.completedLessonIds.includes(lessonId)) return e;

        const completed = [...e.completedLessonIds, lessonId];
        const progressPercent = Math.round(
          (completed.length / e.course.lessons.length) * 100
        );
        return { ...e, completedLessonIds: completed, progressPercent };
      })
    );
  }
}