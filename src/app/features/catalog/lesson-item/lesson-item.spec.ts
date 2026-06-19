import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonItem } from './lesson-item';

describe('LessonItem', () => {
  let component: LessonItem;
  let fixture: ComponentFixture<LessonItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonItem],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
