import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class DatabaseService {
  constructor(private readonly sequelize: Sequelize) {}

  async transaction<T>(fn: (t: any) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(fn);
  }
}
