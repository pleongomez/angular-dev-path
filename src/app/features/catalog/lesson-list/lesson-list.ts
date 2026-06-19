import { Component, input, signal } from '@angular/core';
import { Lesson } from '../../../core/models/lesson.model';
import { LessonItem } from '../lesson-item/lesson-item';

@Component({
  selector: 'app-lesson-list',
  imports: [LessonItem],
  templateUrl: './lesson-list.html',
  styleUrl: './lesson-list.scss',
})
export class LessonList {
  readonly lessons = input.required<Lesson[]>();
  protected readonly expanded = signal(false);

  protected toggle(): void {
    this.expanded.update(v => !v);
  }
}