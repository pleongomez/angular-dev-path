import { Service } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { MOCK_COURSES } from '../data/courses.data';
import { Course, CourseCategory, CourseLevel } from '../models/course.model';

export interface CourseFilters {
  search: string;
  level: CourseLevel | 'all';
  category: CourseCategory | 'all';
}

@Service()
export class CourseService {
  // Fuente de datos — nunca cambia
  private readonly allCourses$ = new BehaviorSubject<Course[]>(MOCK_COURSES);

  // Filtros — cambia cuando el usuario interactúa
  private readonly filters$ = new BehaviorSubject<CourseFilters>({
    search: '',
    level: 'all',
    category: 'all',
  });

  // Cursos filtrados — combinación reactiva de ambos
  readonly courses$: Observable<Course[]> = combineLatest([
    this.allCourses$,
    this.filters$.pipe(debounceTime(250), distinctUntilChanged()),
  ]).pipe(
    map(([courses, filters]) => this.applyFilters(courses, filters))
  );

  updateFilters(partial: Partial<CourseFilters>): void {
    this.filters$.next({ ...this.filters$.getValue(), ...partial });
  }

  getById(id: string): Observable<Course | undefined> {
    return this.allCourses$.pipe(
      map(courses => courses.find(c => c.id === id))
    );
  }

  private applyFilters(courses: Course[], filters: CourseFilters): Course[] {
    return courses.filter(course => {
      const matchesSearch = filters.search === '' ||
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.instructor.toLowerCase().includes(filters.search.toLowerCase());

      const matchesLevel = filters.level === 'all' || course.level === filters.level;
      const matchesCategory = filters.category === 'all' || course.category === filters.category;

      return matchesSearch && matchesLevel && matchesCategory;
    });
  }
}