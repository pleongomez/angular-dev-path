import { Component, input } from '@angular/core';
import { Course } from '../../../core/models/course.model';
import { LessonList } from '../lesson-list/lesson-list';

@Component({
  selector: 'app-course-card',
  imports: [LessonList],
  templateUrl: './course-card.html',
  styleUrl: './course-card.scss',
})
export class CourseCard {
  readonly course = input.required<Course>();
}