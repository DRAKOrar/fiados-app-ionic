import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleDeudaPage } from './detalle-deuda.page';

describe('DetalleDeudaPage', () => {
  let component: DetalleDeudaPage;
  let fixture: ComponentFixture<DetalleDeudaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleDeudaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
