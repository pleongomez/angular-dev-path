import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject, Observable, combineLatest,
  debounceTime, distinctUntilChanged, map, shareReplay,
} from 'rxjs';
import { Course, CourseCategory, CourseLevel } from '../models/course.model';

export interface CourseFilters {
  search: string;
  level: CourseLevel | 'all';
  category: CourseCategory | 'all';
}

@Service()
export class CourseService {
  private readonly http = inject(HttpClient);

  // Llamada HTTP real — shareReplay(1) cachea la respuesta para no repetir la petición
  private readonly allCourses$ = this.http.get<Course[]>('/api/courses').pipe(
    shareReplay(1)
  );

  private readonly filters$ = new BehaviorSubject<CourseFilters>({
    search: '',
    level: 'all',
    category: 'all',
  });

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
      const matchesSearch =
        filters.search === '' ||
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.instructor.toLowerCase().includes(filters.search.toLowerCase());
      const matchesLevel = filters.level === 'all' || course.level === filters.level;
      const matchesCategory = filters.category === 'all' || course.category === filters.category;
      return matchesSearch && matchesLevel && matchesCategory;
    });
  }
}