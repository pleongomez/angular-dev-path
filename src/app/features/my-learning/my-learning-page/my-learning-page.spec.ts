import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyLearningPage } from './my-learning-page';

describe('MyLearningPage', () => {
  let component: MyLearningPage;
  let fixture: ComponentFixture<MyLearningPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyLearningPage],
    }).compileComponents();

    fixture = TestBed.createComponent(MyLearningPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
