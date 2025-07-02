import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start a report export and return a valid id', () => {
    const id = service.startReportExport();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    const state = service.state(id);
    expect(state).toEqual({ accounts: 'starting', yearly: 'pending', fs: 'pending' });
  });

  it('should return default state for unknown id', () => {
    const state = service.state('unknown-id');
    expect(state).toEqual({ accounts: 'idle', yearly: 'idle', fs: 'idle' });
  });
});
