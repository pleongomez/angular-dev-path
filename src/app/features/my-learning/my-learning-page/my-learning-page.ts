import { Component, inject } from '@angular/core';
import { EnrollmentService } from '../../../core/services/enrollment';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-my-learning-page',
  imports: [],
  templateUrl: './my-learning-page.html',
  styleUrl: './my-learning-page.scss',
})
export class MyLearningPage {
  protected readonly enrollmentService = inject(EnrollmentService);
  protected readonly auth = inject(AuthService);
}