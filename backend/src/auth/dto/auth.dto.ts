import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'secureP@ss1' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'Acme Corp' })
    @IsString()
    @IsNotEmpty()
    companyName: string;
}

export class CompleteSignUpDto {
    @ApiProperty({ example: 'jane@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Jane Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'secureP@ss1' })
    @IsString()
    @MinLength(6)
    password: string;
}

export class SignInDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'secureP@ss1' })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class VerifyCodeDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class ResendCodeDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    email: string;
}

export class InviteUserDto {
    @ApiProperty({ example: 'newuser@example.com' })
    @IsEmail()
    email: string;
}
