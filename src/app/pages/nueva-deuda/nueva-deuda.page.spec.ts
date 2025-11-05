import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuevaDeudaPage } from './nueva-deuda.page';

describe('NuevaDeudaPage', () => {
  let component: NuevaDeudaPage;
  let fixture: ComponentFixture<NuevaDeudaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NuevaDeudaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
