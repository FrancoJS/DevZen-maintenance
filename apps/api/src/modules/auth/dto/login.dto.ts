import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico de la cuenta.',
    example: 'usuario@example.test',
    format: 'email',
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    description: 'Contraseña de la cuenta.',
    example: 'contraseña-de-ejemplo',
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
