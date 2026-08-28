import { Controller, Get } from '@nestjs/common'; import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'; import { AssetsService } from './assets.service';
@ApiTags('Assets') @ApiBearerAuth('access-token') @Controller('assets') export class AssetsController { constructor(private readonly assets:AssetsService){} @Get() @ApiOkResponse() findAll(){return this.assets.findAll();} }
