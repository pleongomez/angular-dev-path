import { Component, input } from '@angular/core';
import { Lesson } from '../../../core/models/lesson.model';

@Component({
  selector: 'app-lesson-item',
  imports: [],
  templateUrl: './lesson-item.html',
  styleUrl: './lesson-item.scss',
})
export class LessonItem {
  readonly lesson = input.required<Lesson>();
}