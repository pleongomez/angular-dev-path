import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CourseService } from '../../../core/services/course';
import { CourseCard } from '../course-card/course-card';

@Component({
  selector: 'app-catalog-page',
  imports: [CourseCard],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  protected readonly courseService = inject(CourseService);

  protected readonly courses = toSignal(this.courseService.courses$, { initialValue: [] });

  protected updateSearch(value: string): void {
    this.courseService.updateFilters({ search: value });
  }
}
