import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AprobacionesController } from './aprobaciones/controllers/aprobaciones.controller';
import { AprobacionService } from './aprobaciones/services/aprobacion.service';
require('dotenv').config();

@Module({
   imports: [
    TypeOrmModule.forRoot(
    {
      type: 'mssql',
      host : process.env.BASE_HOST,
      username: process.env.BASE_USER,
      password: process.env.BASE_PASSWORD,
      database: process.env.BASE_DATABASE,
      entities: [],
      synchronize: true,
      options: { encrypt: false },
    }
  ),
  ScheduleModule.forRoot()
  ,MailerModule.forRootAsync(
    {
      useFactory: () => ({
        transport: {
          host : process.env.MAIL_HOST,
          secure: true,
          auth : {
            user : process.env.MAIL_USER,
            pass : process.env.MAIL_PASS
          },
          port : +process.env.MAIL_PORT
        },
      }),
    }
  )
],
  controllers: [AprobacionesController],
  providers: [ AprobacionService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {

  }
}
