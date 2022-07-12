import { Controller, Get } from '@nestjs/common';
import { AprobacionService } from '../services/aprobacion.service';

@Controller('aprobaciones')
export class AprobacionesController {

    constructor(private aprobacionesService: AprobacionService) {}

    // @Get()
    // async aprobacionesDiarias() {
    //     const respuesta = await this.aprobacionesService.retornaAprobaciones()
    //     return respuesta
    // }
}
