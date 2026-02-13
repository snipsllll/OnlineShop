import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBestellungenOverviewTable } from './admin-bestellungen-overview-table';

describe('AdminBestellungenOverviewTable', () => {
  let component: AdminBestellungenOverviewTable;
  let fixture: ComponentFixture<AdminBestellungenOverviewTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBestellungenOverviewTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBestellungenOverviewTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
