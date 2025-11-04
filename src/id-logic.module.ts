import { DynamicModule, Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IdLogicService } from './id-logic.service';
import { SysGeneratedId } from './models/generated-id.model';
import { IdLogic } from './models/id-logic.model';

@Global()
@Module({})
export class IdLogicModule {
  static register(): DynamicModule {
    return {
      module: IdLogicModule,
      imports: [SequelizeModule.forFeature([IdLogic, SysGeneratedId])],
      providers: [IdLogicService],
      exports: [IdLogicService],
    };
  }
}
