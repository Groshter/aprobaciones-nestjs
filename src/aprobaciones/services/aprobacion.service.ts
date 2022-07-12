import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Workbook } from 'exceljs';
import { DataSource } from 'typeorm';
import { AprobacionDto } from '../class/aprobacion.dto';
import * as tmp from 'tmp'
require('dotenv').config();

const fecha = new Date()
const anio = fecha.getFullYear().toString()
const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
const dia = fecha.getDate().toString()
const fechaActual = anio + mes + dia
//const fechaActual = '20220711' //colocar esta fecha para encontra datos y generar el excel
@Injectable()
export class AprobacionService {

     constructor (private dataSource : DataSource, 
                private mailerService: MailerService)
    {

    }

    async retornaAprobaciones(): Promise<AprobacionDto[]>{
        return await this.dataSource.query("EXEC ad_consulta_aprobaciones_diarias @DESDE = '" + fechaActual +"', @HASTA='" + fechaActual +"', @SEARCH='', @ORDERBY=''");
    }

    @Cron('0 55 23 * * 1-5') //lunes a viernes a las 23:55
    async CorreoDiarioAprobacionCRON() {
        const fechaCorreo = dia + "/" + mes + "/" + anio
        const filename = 'Aprobaciones_' + dia.toString() + '_' + mes.toString()  + '_' + anio.toString() + '.xlsx'
        const aprobaciones = await this.retornaAprobaciones()
        if(aprobaciones.length > 0){
            const path = await this.GeneraDocumentoExcel(aprobaciones)
            await this.mailerService.sendMail({
                to: process.env.MAIL_JEFATURA_ADQUISICIONES,
                subject: 'Aprobaciones Diarias ' + fechaCorreo +' ✔',
                html : 'Estimado, <br><strong>Se adjunta listado excel con las aprobaciones del día de hoy.</strong><br><br><br><strong>Por favor, NO contestes este mensaje, es un envío automático.</strong><br>',
                attachments : [{
                    filename : filename.toString(),
                    path : path.toString()
                }]
            }).then(_ => {
                console.log('Correo ' + fechaCorreo +' Enviado :)')
            }).catch(error => {
                console.error('Correo ' + fechaCorreo +'  NO FUE ENVIADO :(')
                console.log(error)
            })
        }else{
            await this.mailerService.sendMail({
                to: process.env.MAIL_JEFATURA_ADQUISICIONES,
                subject: 'Aprobaciones Diarias ' + fechaCorreo +' ✔',
                html : 'Estimado,<br> <strong>No se encontraron aprobaciones para el día de hoy.</strong><br><br><br><strong>Por favor, NO contestes este mensaje, es un envío automático.</strong><br>'
            }).then(_ => {
                console.log('Correo ' + fechaCorreo +' Enviado :)')
            }).catch(error => {
                console.error('Correo ' + fechaCorreo +'  NO FUE ENVIADO :(')
                console.log(error)
            })
        }
    }

    async GeneraDocumentoExcel(aprobaciones : AprobacionDto[]) {
        const workbook = new Workbook()
        workbook.creator = 'INSICO S.A'

        const worksheet = workbook.addWorksheet("Aprobaciones")
        worksheet.properties.tabColor = {argb:'FF00FF00'}

        let rows = []
       
        aprobaciones.forEach(aprob =>{
            rows.push(Object.values(aprob))
        })

        rows.unshift(Object.keys(aprobaciones[0]))
        worksheet.addRows(rows)
        
        worksheet.getRow(1).eachCell((celda) => {
            celda.font = { bold : true,  size : 12 }
            celda.alignment = { vertical : 'middle', horizontal : 'center' }
            celda.border = { bottom: {style:'thin', color: {argb:'000000'}},
                            top: {style:'thin', color: {argb:'000000'}},
                            left: {style:'thin', color: {argb:'000000'}},
                            right: {style:'thin', color: {argb:'000000'}}}
        })

        worksheet.columns = [
            { header: "N Solicitud", key: "SolicitudId", width: 15 },
            { header: "Flujo", key: "Descripcion", width: 30 },
            { header: "Fecha Apro", key: "Fecha", width: 15 },
            { header: "Observacion", key: "Observacion", width: 70 },
            { header: "Funcionario", key: "UsuarioAlias", width: 15 },
        ]

        let excel = await new Promise((resolve, reject) => {
            tmp.file({ discarDescriptor : true, prefix : 'AprobacionesExcel', postfix :'.xlsx', mode: parseInt('0600', 8) }, async(error, file) => {
                if(error)
                    throw new BadRequestException(error)

                workbook.xlsx.writeFile(file).then(_ => {
                    resolve(file)
                }).catch(error => {
                    throw new BadRequestException(error)
                })
            })
        })
        return excel
    }
}
